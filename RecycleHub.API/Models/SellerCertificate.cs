namespace RecycleHub.API.Models
{
    /// <summary>Verified certificates shown on seller profile (document URL is internal).</summary>
    public class SellerCertificate
    {
        public int SellerCertificateId { get; set; }
        public int SellerUserId { get; set; }
        public string CertificateName { get; set; } = string.Empty;
        public string IssuingAuthority { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string DocumentUrl { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User SellerUser { get; set; } = null!;
    }
}
