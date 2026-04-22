using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.DTOs.ReviewDtos
{
    public class CreateReviewDto
    {
        public int OrderId { get; set; }
        public int SellerUserId { get; set; }
        public byte Rating { get; set; }
        public string? Comment { get; set; }
    }

    public class ModerateReviewDto
    {
        public ReviewStatus Status { get; set; }
        public string? HiddenReason { get; set; }
    }

    public class ReviewResponseDto
    {
        public int ReviewId { get; set; }
        public int OrderId { get; set; }
        public int BuyerUserId { get; set; }
        public string BuyerUsername { get; set; } = string.Empty;
        public string BuyerFullName { get; set; } = string.Empty;
        public int SellerUserId { get; set; }
        public string SellerUsername { get; set; } = string.Empty;
        public byte Rating { get; set; }
        public string? Comment { get; set; }
        public ReviewStatus Status { get; set; }
        public string? HiddenReason { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ReviewFilterDto
    {
        public int? SellerUserId { get; set; }
        public int? BuyerUserId { get; set; }
        public ReviewStatus? Status { get; set; }
        public int? MinRating { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
