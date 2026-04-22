using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.DTOs.CertificateDtos
{
    public class CertificateUpdateRequestResponseDto
    {
        public int RequestId { get; set; }
        public int SellerUserId { get; set; }
        public string SellerName { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string CertificateName { get; set; } = string.Empty;
        public string IssuingAuthority { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string DocumentUrl { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public CertificateRequestStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PublicSellerCertificateDto
    {
        public string CertificateName { get; set; } = string.Empty;
        public string IssuingAuthority { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
    }

    public class PublicSellerProfileDto
    {
        public int UserId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsVerified { get; set; }
        public int MemberSinceYear { get; set; }
        public string? ProfileImageUrl { get; set; }
        public int TotalListings { get; set; }
        public int TotalSales { get; set; }
        public decimal AverageRating { get; set; }
        public int? ResponseRatePercent { get; set; }
        public List<PublicSellerCertificateDto> Certificates { get; set; } = new();
    }
}
