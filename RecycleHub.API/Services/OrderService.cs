using Microsoft.EntityFrameworkCore;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.Data;
using RecycleHub.API.DTOs.OrderDtos;
using RecycleHub.API.Models;
using RecycleHub.API.Services.Interfaces;

namespace RecycleHub.API.Services
{
    public class OrderService : IOrderService
    {
        private readonly AppDbContext _db;
        private readonly INotificationService _notif;
        private readonly ISellerProfileService _sellerProfile;

        public OrderService(AppDbContext db, INotificationService notif, ISellerProfileService sellerProfile)
        {
            _db            = db;
            _notif         = notif;
            _sellerProfile  = sellerProfile;
        }

        // ── Query ─────────────────────────────────────────────────────────
        public async Task<PagedResult<OrderResponseDto>> GetAllOrdersAsync(OrderFilterDto filter)
        {
            var q = BuildQuery().AsQueryable();
            q = ApplyFilters(q, filter);
            var items = await Paginate(q, filter);
            return items;
        }

        public async Task<OrderResponseDto?> GetOrderByIdAsync(int orderId)
        {
            var o = await BuildQuery().FirstOrDefaultAsync(x => x.OrderId == orderId);
            return o == null ? null : ToDto(o);
        }

        public async Task<PagedResult<OrderResponseDto>> GetOrdersByBuyerAsync(int buyerUserId, OrderFilterDto filter)
        {
            var q = BuildQuery().Where(o => o.BuyerUserId == buyerUserId);
            q = ApplyFilters(q, filter);
            return await Paginate(q, filter);
        }

        public async Task<PagedResult<OrderResponseDto>> GetOrdersBySellerAsync(int sellerUserId, OrderFilterDto filter)
        {
            var q = BuildQuery()
                .Where(o => o.SellerUserId == sellerUserId && o.Status != OrderStatus.AwaitingPayment);
            q = ApplyFilters(q, filter);
            return await Paginate(q, filter);
        }

        // ── Mutations ─────────────────────────────────────────────────────
        public async Task<(bool Success, string Message, OrderResponseDto? Data)> PlaceOrderAsync(int buyerUserId, CreateOrderDto dto)
        {
            var material = await _db.Materials.FindAsync(dto.MaterialId);
            if (material == null) return (false, "Material not found.", null);
            if (material.Status != MaterialStatus.Available)
                return (false, "Material is not available for ordering.", null);
            if (dto.QuantityOrdered < material.MinOrderQty)
                return (false, $"Minimum order quantity is {material.MinOrderQty} {material.Unit}.", null);
            if (dto.QuantityOrdered > material.Quantity)
                return (false, "Insufficient quantity available.", null);

            var order = new Order
            {
                BuyerUserId      = buyerUserId,
                SellerUserId     = material.SellerUserId,
                MaterialId       = dto.MaterialId,
                QuantityOrdered  = dto.QuantityOrdered,
                OfferedUnitPrice = dto.OfferedUnitPrice,
                TotalAmount      = dto.QuantityOrdered * dto.OfferedUnitPrice,
                Currency         = dto.Currency,
                BuyerNote        = dto.BuyerNote,
                ShippingAddress  = dto.ShippingAddress,
                Status           = OrderStatus.AwaitingPayment,
                OrderDate        = DateTime.UtcNow
            };
            _db.Orders.Add(order);
            await _db.SaveChangesAsync();

            var result = await GetOrderByIdAsync(order.OrderId);
            return (true, "Order reserved. Complete mobile money payment to notify the seller.", result);
        }

        public async Task<(bool Success, string Message)> ConfirmOrderAsync(int orderId)
        {
            var o = await _db.Orders.FindAsync(orderId);
            if (o == null) return (false, "Order not found.");
            if (o.Status != OrderStatus.Pending) return (false, "Only pending orders can be confirmed.");
            o.Status    = OrderStatus.Accepted;
            o.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await _notif.SendNotificationAsync(o.BuyerUserId,
                "Order Confirmed", "Your order has been accepted by the seller.",
                NotificationType.Order, orderId, "Orders");
            return (true, "Order confirmed.");
        }

        public async Task<(bool Success, string Message)> RejectOrderAsync(int orderId, int sellerUserId, string? note)
        {
            var o = await _db.Orders.FindAsync(orderId);
            if (o == null) return (false, "Order not found.");
            if (o.SellerUserId != sellerUserId) return (false, "You can only reject orders for your own listings.");
            if (o.Status != OrderStatus.Pending) return (false, "Only pending orders can be rejected.");
            o.Status     = OrderStatus.Rejected;
            o.SellerNote = note;
            o.UpdatedAt  = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await _notif.SendNotificationAsync(o.BuyerUserId,
                "Order declined", "A seller has declined your order.",
                NotificationType.Order, orderId, "Orders");
            return (true, "Order rejected.");
        }

        public async Task<(bool Success, string Message)> ShipOrderAsync(int orderId)
        {
            var o = await _db.Orders.FindAsync(orderId);
            if (o == null) return (false, "Order not found.");
            if (o.Status != OrderStatus.Paid) return (false, "Order must be paid before shipping.");
            o.Status    = OrderStatus.Shipped;
            o.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await _notif.SendNotificationAsync(o.BuyerUserId,
                "Order Shipped", "Your order is on its way!",
                NotificationType.Order, orderId, "Orders");
            return (true, "Order marked as shipped.");
        }

        public async Task<(bool Success, string Message)> DeliverOrderAsync(int orderId)
        {
            var o = await _db.Orders.FindAsync(orderId);
            if (o == null) return (false, "Order not found.");
            if (o.Status != OrderStatus.Shipped) return (false, "Order must be shipped before delivery.");
            o.Status      = OrderStatus.Delivered;
            o.DeliveredAt = DateTime.UtcNow;
            o.UpdatedAt   = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            // Update seller stats
            await _sellerProfile.UpdateSellerStatsAsync(o.SellerUserId);
            await _notif.SendNotificationAsync(o.BuyerUserId,
                "Order Delivered", "Your order has been delivered.",
                NotificationType.Order, orderId, "Orders");
            return (true, "Order delivered.");
        }

        public async Task<(bool Success, string Message)> CancelOrderAsync(int orderId, string reason, int requesterUserId)
        {
            var o = await _db.Orders.FindAsync(orderId);
            if (o == null) return (false, "Order not found.");
            if (o.Status is OrderStatus.Delivered or OrderStatus.Cancelled)
                return (false, "Cannot cancel a delivered or already-cancelled order.");

            var requester = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == requesterUserId);
            if (requester == null) return (false, "User not found.");

            var isAdmin = requester.Role == UserRole.Admin;
            if (!isAdmin)
            {
                if (o.BuyerUserId != requesterUserId)
                    return (false, "You can only cancel your own orders.");
                if (o.Status != OrderStatus.Pending && o.Status != OrderStatus.AwaitingPayment)
                    return (false, "Only pending or unpaid reservations can be cancelled.");
            }

            o.Status       = OrderStatus.Cancelled;
            o.CancelReason = reason;
            o.CancelledAt  = DateTime.UtcNow;
            o.UpdatedAt    = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await _notif.SendNotificationAsync(o.SellerUserId,
                "Order Cancelled", $"Order #{orderId} was cancelled. Reason: {reason}",
                NotificationType.Order, orderId, "Orders");
            return (true, "Order cancelled.");
        }

        // ── Private helpers ───────────────────────────────────────────────
        private IQueryable<Order> BuildQuery() =>
            _db.Orders
                .Include(o => o.BuyerUser)
                .Include(o => o.SellerUser).ThenInclude(u => u.SellerProfile)
                .Include(o => o.Material)
                .Include(o => o.Payment)
                .AsQueryable();

        private static IQueryable<Order> ApplyFilters(IQueryable<Order> q, OrderFilterDto f)
        {
            if (f.Status.HasValue) q = q.Where(o => o.Status == f.Status);
            if (f.FromDate.HasValue) q = q.Where(o => o.OrderDate >= f.FromDate);
            if (f.ToDate.HasValue)   q = q.Where(o => o.OrderDate <= f.ToDate);
            return q.OrderByDescending(o => o.OrderDate);
        }

        private static async Task<PagedResult<OrderResponseDto>> Paginate(IQueryable<Order> q, OrderFilterDto f)
        {
            var total = await q.CountAsync();
            var items = await q.Skip((f.PageNumber - 1) * f.PageSize).Take(f.PageSize).ToListAsync();
            return new PagedResult<OrderResponseDto>
            {
                Items      = items.Select(ToDto).ToList(),
                TotalCount = total,
                PageNumber = f.PageNumber,
                PageSize   = f.PageSize
            };
        }

        private static OrderResponseDto ToDto(Order o) => new()
        {
            OrderId          = o.OrderId,
            BuyerUserId      = o.BuyerUserId,
            BuyerUsername    = o.BuyerUser?.Username ?? "",
            BuyerFullName    = $"{o.BuyerUser?.FirstName} {o.BuyerUser?.LastName}",
            BuyerEmail       = o.BuyerUser?.Email ?? "",
            SellerUserId     = o.SellerUserId,
            SellerUsername   = o.SellerUser?.Username ?? "",
            SellerCompanyName= o.SellerUser?.SellerProfile?.CompanyName ?? "",
            MaterialId       = o.MaterialId,
            MaterialTitle    = o.Material?.Title ?? "",
            MaterialType     = o.Material?.MaterialType.ToString() ?? "",
            Unit             = o.Material?.Unit ?? "",
            QuantityOrdered  = o.QuantityOrdered,
            OfferedUnitPrice = o.OfferedUnitPrice,
            TotalAmount      = o.TotalAmount,
            Currency         = o.Currency,
            Status           = o.Status,
            BuyerNote        = o.BuyerNote,
            SellerNote       = o.SellerNote,
            ShippingAddress  = o.ShippingAddress,
            ExpectedDeliveryAt=o.ExpectedDeliveryAt,
            DeliveredAt      = o.DeliveredAt,
            CancelledAt      = o.CancelledAt,
            CancelReason     = o.CancelReason,
            OrderDate        = o.OrderDate,
            HasPayment       = o.Payment != null,
            PaymentStatus    = o.Payment?.PaymentStatus.ToString()
        };
    }
}
