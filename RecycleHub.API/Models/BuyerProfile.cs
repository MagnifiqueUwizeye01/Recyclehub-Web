namespace RecycleHub.API.Models
{
    /// <summary>Maps to dbo.BuyerProfiles — no Country, no VerificationStatus.</summary>
    public class BuyerProfile
    {
        public int BuyerProfileId { get; set; }
        public int UserId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string IndustryType { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? WebsiteUrl { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // ── Navigation ────────────────────────────────────────────────────────
        public User User { get; set; } = null!;
    }
}
