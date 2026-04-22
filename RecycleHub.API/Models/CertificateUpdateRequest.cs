using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.Models
{
    public class CertificateUpdateRequest
    {
        public int RequestId { get; set; }
        public int SellerUserId { get; set; }
        public string CertificateName { get; set; } = string.Empty;
        public string IssuingAuthority { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string DocumentUrl { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public CertificateRequestStatus Status { get; set; } = CertificateRequestStatus.Pending;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewedAt { get; set; }

        public User SellerUser { get; set; } = null!;
    }
}
