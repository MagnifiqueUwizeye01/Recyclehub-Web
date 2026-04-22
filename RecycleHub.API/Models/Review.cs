using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.Models
{
    /// <summary>Maps to dbo.Reviews — BuyerUserId/SellerUserId are direct User FKs, not profile IDs.</summary>
    public class Review
    {
        public int ReviewId { get; set; }
        public int OrderId { get; set; }
        public int BuyerUserId { get; set; }
        public int SellerUserId { get; set; }
        public byte Rating { get; set; }
        public string? Comment { get; set; }
        public ReviewStatus Status { get; set; } = ReviewStatus.Visible;
        public string? HiddenReason { get; set; }
        public int? HiddenByAdminId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // ── Navigation ────────────────────────────────────────────────────────
        public Order Order { get; set; } = null!;
        public User BuyerUser { get; set; } = null!;
        public User SellerUser { get; set; } = null!;
        public User? HiddenByAdmin { get; set; }
    }
}
