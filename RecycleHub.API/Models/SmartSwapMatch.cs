using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.Models
{
    /// <summary>Maps to dbo.SmartSwapMatches — SuggestedBuyerUserId + SuggestedSellerUserId FKs.</summary>
    public class SmartSwapMatch
    {
        public int MatchId { get; set; }
        public int MaterialId { get; set; }
        public int? SuggestedBuyerUserId { get; set; }
        public int? SuggestedSellerUserId { get; set; }
        public decimal MatchScore { get; set; }
        public string? SuggestedReason { get; set; }
        public MatchStatus MatchStatus { get; set; } = MatchStatus.Suggested;
        public DateTime? ViewedAt { get; set; }
        public DateTime? RespondedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // ── Navigation ────────────────────────────────────────────────────────
        public Material Material { get; set; } = null!;
        public User? SuggestedBuyerUser { get; set; }
        public User? SuggestedSellerUser { get; set; }
    }
}
