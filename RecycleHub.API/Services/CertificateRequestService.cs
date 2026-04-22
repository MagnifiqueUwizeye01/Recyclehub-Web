using Microsoft.EntityFrameworkCore;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.Data;
using RecycleHub.API.DTOs.CertificateDtos;
using RecycleHub.API.DTOs.MessageDtos;
using RecycleHub.API.Models;
using RecycleHub.API.Services.Interfaces;

namespace RecycleHub.API.Services
{
    public class CertificateRequestService : ICertificateRequestService
    {
        private readonly AppDbContext _db;
        private readonly IMessageService _messages;

        public CertificateRequestService(AppDbContext db, IMessageService messages)
        {
            _db = db;
            _messages = messages;
        }

        public async Task<(bool Success, string Message, CertificateUpdateRequestResponseDto? Data)> SubmitRequestAsync(
            int sellerUserId, string certificateName, string issuingAuthority,
            DateTime issueDate, DateTime? expiryDate, string documentUrl, string? notes)
        {
            var profile = await _db.SellerProfiles.AsNoTracking().FirstOrDefaultAsync(s => s.UserId == sellerUserId);
            if (profile == null) return (false, "Seller profile not found.", null);

            var req = new CertificateUpdateRequest
            {
                SellerUserId = sellerUserId,
                CertificateName = certificateName.Trim(),
                IssuingAuthority = issuingAuthority.Trim(),
                IssueDate = issueDate,
                ExpiryDate = expiryDate,
                DocumentUrl = documentUrl,
                Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim(),
                Status = CertificateRequestStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };
            _db.CertificateUpdateRequests.Add(req);
            await _db.SaveChangesAsync();

            return (true, "Request submitted.", await ToDtoAsync(req.RequestId));
        }

        public async Task<PagedResult<CertificateUpdateRequestResponseDto>> GetRequestsAsync(
            CertificateRequestStatus? status, int page, int pageSize)
        {
            var q = _db.CertificateUpdateRequests
                .Include(r => r.SellerUser).ThenInclude(u => u.SellerProfile!)
                .AsQueryable();
            if (status.HasValue) q = q.Where(r => r.Status == status.Value);

            var total = await q.CountAsync();
            var items = await q.OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .ToListAsync();

            return new PagedResult<CertificateUpdateRequestResponseDto>
            {
                Items = items.Select(MapRow).ToList(),
                TotalCount = total,
                PageNumber = page,
                PageSize = pageSize
            };
        }

        public async Task<(bool Success, string Message)> ApproveAsync(int sellerUserId, int requestId, int adminUserId)
        {
            var req = await _db.CertificateUpdateRequests.FirstOrDefaultAsync(r => r.RequestId == requestId && r.SellerUserId == sellerUserId);
            if (req == null) return (false, "Request not found.");
            if (req.Status != CertificateRequestStatus.Pending) return (false, "Request is not pending.");

            var cert = new SellerCertificate
            {
                SellerUserId = sellerUserId,
                CertificateName = req.CertificateName,
                IssuingAuthority = req.IssuingAuthority,
                IssueDate = req.IssueDate,
                ExpiryDate = req.ExpiryDate,
                DocumentUrl = req.DocumentUrl,
                CreatedAt = DateTime.UtcNow
            };
            _db.SellerCertificates.Add(cert);

            req.Status = CertificateRequestStatus.Approved;
            req.ReviewedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            await _messages.SendMessageAsync(adminUserId, new SendMessageDto
            {
                ReceiverUserId = sellerUserId,
                MessageType = MessageType.AdminNotice,
                MessageText = "Your certificate has been approved and added to your profile."
            });

            return (true, "Certificate approved.");
        }

        public async Task<(bool Success, string Message)> RejectAsync(int sellerUserId, int requestId, int adminUserId, string? adminNote)
        {
            var req = await _db.CertificateUpdateRequests.FirstOrDefaultAsync(r => r.RequestId == requestId && r.SellerUserId == sellerUserId);
            if (req == null) return (false, "Request not found.");
            if (req.Status != CertificateRequestStatus.Pending) return (false, "Request is not pending.");

            req.Status = CertificateRequestStatus.Rejected;
            req.ReviewedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            var text = string.IsNullOrWhiteSpace(adminNote)
                ? "Dear seller, your request to add a new certificate to your profile has been rejected. The submitted document could not be verified. Please ensure your certificate is valid and clearly legible before resubmitting."
                : adminNote.Trim();

            await _messages.SendMessageAsync(adminUserId, new SendMessageDto
            {
                ReceiverUserId = sellerUserId,
                MessageType = MessageType.AdminNotice,
                MessageText = text
            });

            return (true, "Certificate request rejected.");
        }

        private async Task<CertificateUpdateRequestResponseDto?> ToDtoAsync(int requestId)
        {
            var r = await _db.CertificateUpdateRequests
                .Include(x => x.SellerUser).ThenInclude(u => u.SellerProfile!)
                .FirstOrDefaultAsync(x => x.RequestId == requestId);
            return r == null ? null : MapRow(r);
        }

        private static CertificateUpdateRequestResponseDto MapRow(CertificateUpdateRequest r)
        {
            var sp = r.SellerUser.SellerProfile;
            return new CertificateUpdateRequestResponseDto
            {
                RequestId = r.RequestId,
                SellerUserId = r.SellerUserId,
                SellerName = $"{r.SellerUser.FirstName} {r.SellerUser.LastName}".Trim(),
                CompanyName = sp?.CompanyName ?? "",
                CertificateName = r.CertificateName,
                IssuingAuthority = r.IssuingAuthority,
                IssueDate = r.IssueDate,
                ExpiryDate = r.ExpiryDate,
                DocumentUrl = r.DocumentUrl,
                Notes = r.Notes,
                Status = r.Status,
                CreatedAt = r.CreatedAt
            };
        }
    }
}
