using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.Models
{
    /// <summary>Maps to dbo.SellerProfiles — no Country.</summary>
    public class SellerProfile
    {
        public int SellerProfileId { get; set; }
        public int UserId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string LicenseDocument { get; set; } = string.Empty;
        public VerificationStatus VerificationStatus { get; set; } = VerificationStatus.Pending;
        public string? VerificationNote { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public int? VerifiedByAdminId { get; set; }
        public string City { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? WebsiteUrl { get; set; }
        public string? Description { get; set; }
        public int TotalSales { get; set; } = 0;
        public decimal AverageRating { get; set; } = 0.00m;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // ── Navigation ────────────────────────────────────────────────────────
        public User User { get; set; } = null!;
        public User? VerifiedByAdmin { get; set; }
        public ICollection<Material> Materials { get; set; } = new List<Material>();
    }
}
