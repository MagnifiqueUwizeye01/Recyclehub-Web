using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.DTOs.SmartSwapMatchDtos
{
    public class CreateSmartSwapMatchDto
    {
        public int MaterialId { get; set; }
        public int? SuggestedBuyerUserId { get; set; }
        public int? SuggestedSellerUserId { get; set; }
        public decimal MatchScore { get; set; }
        public string? SuggestedReason { get; set; }
    }

    public class SmartSwapMatchResponseDto
    {
        public int MatchId { get; set; }
        public int MaterialId { get; set; }
        public string MaterialTitle { get; set; } = string.Empty;
        public string MaterialType { get; set; } = string.Empty;
        public int? SuggestedBuyerUserId { get; set; }
        public string? BuyerUsername { get; set; }
        public int? SuggestedSellerUserId { get; set; }
        public string? SellerUsername { get; set; }
        public decimal MatchScore { get; set; }
        public string? SuggestedReason { get; set; }
        public MatchStatus MatchStatus { get; set; }
        public DateTime? ViewedAt { get; set; }
        public DateTime? RespondedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateMatchStatusDto
    {
        public MatchStatus MatchStatus { get; set; }
    }
}
