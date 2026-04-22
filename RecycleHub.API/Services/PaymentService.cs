using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.Common.Settings;
using RecycleHub.API.Data;
using RecycleHub.API.DTOs.PaymentDtos;
using RecycleHub.API.Models;
using RecycleHub.API.Services.Interfaces;

namespace RecycleHub.API.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly AppDbContext _db;
        private readonly INotificationService _notif;
        private readonly IPawaPayDepositClient _pawaPay;
        private readonly PawaPaySettings _pawaOpts;

        public PaymentService(
            AppDbContext db,
            INotificationService notif,
            IPawaPayDepositClient pawaPay,
            IOptions<PawaPaySettings> pawaOpts)
        {
            _db = db;
            _notif = notif;
            _pawaPay = pawaPay;
            _pawaOpts = pawaOpts.Value;
        }

        public async Task<PagedResult<PaymentResponseDto>> GetAllPaymentsAsync(int pageNumber, int pageSize)
        {
            pageNumber = Math.Max(1, pageNumber);
            pageSize = Math.Clamp(pageSize, 1, 200);
            var q = _db.Payments
                .Include(x => x.BuyerUser)
                .Include(x => x.Order).ThenInclude(o => o.Material)
                .OrderByDescending(x => x.CreatedAt);
            var total = await q.CountAsync();
            var rows = await q.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();
            return new PagedResult<PaymentResponseDto>
            {
                Items = rows.Select(ToDto).ToList(),
                TotalCount = total,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        public async Task<PaymentResponseDto?> GetPaymentByOrderIdAsync(int orderId)
        {
            var p = await _db.Payments.Include(x => x.BuyerUser).Include(x => x.Order).ThenInclude(o => o.Material)
                .FirstOrDefaultAsync(x => x.OrderId == orderId);
            return p == null ? null : ToDto(p);
        }

        public async Task<PaymentResponseDto?> GetPaymentByIdAsync(int paymentId)
        {
            var p = await _db.Payments.Include(x => x.BuyerUser).Include(x => x.Order).ThenInclude(o => o.Material)
                .FirstOrDefaultAsync(x => x.PaymentId == paymentId);
            return p == null ? null : ToDto(p);
        }

        public async Task<(bool Success, string Message, PaymentResponseDto? Data)> InitiatePaymentAsync(int buyerUserId, CreatePaymentDto dto)
        {
            var order = await _db.Orders.Include(o => o.Material).FirstOrDefaultAsync(o => o.OrderId == dto.OrderId);
            if (order == null) return (false, "Order not found.", null);
            if (order.BuyerUserId != buyerUserId) return (false, "Unauthorized.", null);

            // AwaitingPayment = pay-before-seller; Accepted = legacy pay-after-accept; Pending = older orders still unpaid
            if (order.Status is not (OrderStatus.AwaitingPayment or OrderStatus.Accepted or OrderStatus.Pending))
                return (false, $"Payment is not available while the order status is {order.Status}.", null);

            if (await _db.Payments.AnyAsync(p => p.OrderId == dto.OrderId && p.PaymentStatus == PaymentStatus.Successful))
                return (false, "Order is already paid.", null);

            var existingOpen = await _db.Payments
                .FirstOrDefaultAsync(p => p.OrderId == dto.OrderId && p.PaymentStatus == PaymentStatus.Requested);
            if (existingOpen != null && existingOpen.RequestedAt > DateTime.UtcNow.AddHours(-1))
            {
                await _db.Entry(existingOpen).Reference(p => p.BuyerUser).LoadAsync();
                await _db.Entry(existingOpen).Reference(p => p.Order).LoadAsync();
                await _db.Entry(existingOpen.Order).Reference(o => o.Material).LoadAsync();
                return (true, "A payment is already in progress for this order.", ToDto(existingOpen));
            }

            var phone = NormalizeRwandaPhone(dto.PhoneNumber);
            if (phone.Length < 12)
                return (false, "Enter a valid Rwanda mobile number (e.g. 07… or 250…).", null);

            var provider = ResolveProvider(dto.PaymentChannel);
            var depositId = Guid.NewGuid();

            var payment = new Payment
            {
                OrderId = dto.OrderId,
                BuyerUserId = buyerUserId,
                Amount = order.TotalAmount,
                PaymentMethod = "MobileMoney",
                PhoneNumber = phone,
                Currency = dto.Currency,
                ExternalReference = depositId.ToString("D"),
                PaymentStatus = PaymentStatus.Requested,
                RequestMessage = dto.RequestMessage,
                RequestedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            _db.Payments.Add(payment);
            await _db.SaveChangesAsync();

            var (ok, msg, initStatus) = await _pawaPay.InitiateDepositAsync(
                depositId,
                order.TotalAmount,
                dto.Currency,
                phone,
                provider);

            if (!ok)
            {
                payment.PaymentStatus = PaymentStatus.Failed;
                payment.FailureReason = msg;
                payment.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
                return (false, msg, ToDto(payment));
            }

            await _db.Entry(payment).Reference(p => p.BuyerUser).LoadAsync();
            await _db.Entry(payment).Reference(p => p.Order).LoadAsync();
            await _db.Entry(payment.Order).Reference(o => o.Material).LoadAsync();

            await _notif.SendNotificationAsync(buyerUserId, "Payment initiated",
                $"Authorize the {order.TotalAmount} {order.Currency} request on your phone.",
                NotificationType.Payment, payment.PaymentId, "Payments");

            var userMsg = initStatus == "DUPLICATE_IGNORED"
                ? "Deposit already registered. Check your phone or wait for confirmation."
                : "Payment initiated. Approve the prompt on your phone.";
            return (true, userMsg, ToDto(payment));
        }

        public async Task<(bool Success, string Message)> HandleCallbackAsync(PaymentCallbackDto dto)
        {
            var payment = await _db.Payments.Include(p => p.Order).ThenInclude(o => o.Material)
                .FirstOrDefaultAsync(p => p.ExternalReference == dto.ExternalReference);
            if (payment == null) return (false, "Payment not found.");

            Enum.TryParse<PaymentStatus>(dto.PaymentStatus, true, out var newStatus);
            payment.PaymentStatus = newStatus;
            payment.MoMoReferenceId = dto.MoMoReferenceId;
            payment.FinancialTransactionId = dto.FinancialTransactionId;
            payment.FailureReason = dto.FailureReason;
            payment.UpdatedAt = DateTime.UtcNow;

            if (newStatus == PaymentStatus.Successful)
            {
                await MarkSuccessfulAsync(payment);
            }
            else if (newStatus is PaymentStatus.Failed or PaymentStatus.Cancelled or PaymentStatus.Expired)
            {
                await _notif.SendNotificationAsync(payment.BuyerUserId, "Payment Failed",
                    $"Payment not completed: {dto.FailureReason}", NotificationType.Payment, payment.PaymentId, "Payments");
            }

            await _db.SaveChangesAsync();
            return (true, "Callback processed.");
        }

        public async Task<(bool Success, string Message)> HandlePawaPayWebhookAsync(JsonDocument doc)
        {
            if (!TryExtractDepositStatus(doc.RootElement, out var depositId, out var state, out var failure))
                return (false, "Unrecognized callback payload.");

            var payment = await _db.Payments.Include(p => p.Order).ThenInclude(o => o.Material)
                .FirstOrDefaultAsync(p => p.ExternalReference == depositId.ToString("D"));
            if (payment == null)
                return (false, "Payment not found.");

            if (payment.PaymentStatus == PaymentStatus.Successful)
                return (true, "Already processed.");

            payment.UpdatedAt = DateTime.UtcNow;

            if (state == "COMPLETED")
            {
                payment.PaymentStatus = PaymentStatus.Successful;
                payment.PaidAt = DateTime.UtcNow;
                payment.MoMoReferenceId = depositId.ToString("D");
                if (!string.IsNullOrEmpty(failure))
                    payment.FailureReason = null;
                await MarkSuccessfulAsync(payment);
                await _db.SaveChangesAsync();
                return (true, "Deposit completed.");
            }

            if (state is "FAILED" or "EXPIRED")
            {
                payment.PaymentStatus = state == "EXPIRED" ? PaymentStatus.Expired : PaymentStatus.Failed;
                payment.FailureReason = failure;
                await _notif.SendNotificationAsync(payment.BuyerUserId, "Payment not completed",
                    failure ?? state, NotificationType.Payment, payment.PaymentId, "Payments");
                await _db.SaveChangesAsync();
                return (true, "Failure recorded.");
            }

            await _db.SaveChangesAsync();
            return (true, "Status noted.");
        }

        public async Task<(bool Success, string Message)> CheckPaymentStatusAsync(int paymentId)
        {
            var p = await _db.Payments.Include(x => x.Order).ThenInclude(o => o.Material)
                .FirstOrDefaultAsync(x => x.PaymentId == paymentId);
            if (p == null) return (false, "Payment not found.");
            if (p.PaymentStatus == PaymentStatus.Successful)
                return (true, PaymentStatus.Successful.ToString());

            if (string.IsNullOrWhiteSpace(p.ExternalReference) || !Guid.TryParse(p.ExternalReference, out var depositId))
                return (true, p.PaymentStatus.ToString());

            var (found, state, fail) = await _pawaPay.GetDepositStateAsync(depositId);
            if (!found || state == null)
                return (true, p.PaymentStatus.ToString());

            if (state == "COMPLETED" && p.PaymentStatus != PaymentStatus.Successful)
            {
                p.PaymentStatus = PaymentStatus.Successful;
                p.PaidAt = DateTime.UtcNow;
                p.UpdatedAt = DateTime.UtcNow;
                await MarkSuccessfulAsync(p);
                await _db.SaveChangesAsync();
                return (true, PaymentStatus.Successful.ToString());
            }

            if (state is "FAILED" && p.PaymentStatus != PaymentStatus.Failed)
            {
                p.PaymentStatus = PaymentStatus.Failed;
                p.FailureReason = fail;
                p.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }

            return (true, p.PaymentStatus.ToString());
        }

        private async Task MarkSuccessfulAsync(Payment payment)
        {
            payment.PaidAt ??= DateTime.UtcNow;
            var prior = payment.Order.Status;

            if (prior is OrderStatus.AwaitingPayment or OrderStatus.Pending or OrderStatus.Accepted)
            {
                payment.Order.Status = OrderStatus.Paid;
                payment.Order.UpdatedAt = DateTime.UtcNow;
            }

            if (prior is OrderStatus.AwaitingPayment or OrderStatus.Pending or OrderStatus.Accepted)
            {
                await _notif.SendNotificationAsync(payment.Order.SellerUserId, "Payment received",
                    $"Order #{payment.OrderId} for '{payment.Order.Material?.Title}' has been paid.",
                    NotificationType.Payment, payment.OrderId, "Orders", $"/orders/{payment.OrderId}");
            }

            await _notif.SendNotificationAsync(payment.BuyerUserId, "Payment successful",
                "Your payment was processed successfully.", NotificationType.Payment, payment.PaymentId, "Payments");
        }

        private static bool TryExtractDepositStatus(JsonElement root, out Guid depositId, out string? state, out string? failure)
        {
            depositId = default;
            state = null;
            failure = null;

            JsonElement payload = root;
            if (root.TryGetProperty("data", out var data))
                payload = data;

            if (payload.TryGetProperty("depositId", out var idEl))
            {
                var s = idEl.GetString();
                if (s != null && Guid.TryParse(s, out depositId))
                {
                    if (payload.TryGetProperty("status", out var st))
                        state = st.GetString();
                    if (payload.TryGetProperty("failureReason", out var fr))
                    {
                        var code = fr.TryGetProperty("failureCode", out var fc) ? fc.GetString() : "";
                        var msg = fr.TryGetProperty("failureMessage", out var fm) ? fm.GetString() : "";
                        failure = $"{code}: {msg}".Trim(' ', ':');
                    }
                    return true;
                }
            }

            return false;
        }

        private string ResolveProvider(string? channel)
        {
            // MTN Mobile Money only — Airtel Money is not offered in the product UI.
            _ = channel;
            return _pawaOpts.DefaultMtnProvider;
        }

        private static string NormalizeRwandaPhone(string raw)
        {
            var digits = new string(raw.Where(char.IsDigit).ToArray());
            if (digits.StartsWith("250", StringComparison.Ordinal) && digits.Length >= 12)
                return digits;
            if (digits.StartsWith("0") && digits.Length >= 10)
                return "250" + digits.TrimStart('0');
            if (digits.Length == 9)
                return "250" + digits;
            return digits;
        }

        private static PaymentResponseDto ToDto(Payment p) => new()
        {
            PaymentId = p.PaymentId, OrderId = p.OrderId, BuyerUserId = p.BuyerUserId,
            BuyerUsername = p.BuyerUser?.Username ?? "",
            MaterialTitle = p.Order?.Material?.Title ?? "",
            PaymentMethod = p.PaymentMethod, PaymentStatus = p.PaymentStatus,
            Amount = p.Amount, Currency = p.Currency, PhoneNumber = p.PhoneNumber,
            ExternalReference = p.ExternalReference, MoMoReferenceId = p.MoMoReferenceId,
            FinancialTransactionId = p.FinancialTransactionId, FailureReason = p.FailureReason,
            RequestedAt = p.RequestedAt, PaidAt = p.PaidAt, CreatedAt = p.CreatedAt
        };
    }
}
