using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.ReviewDtos;

namespace RecycleHub.API.Services.Interfaces
{
    public interface IReviewService
    {
        Task<PagedResult<ReviewResponseDto>> GetAllReviewsAsync(ReviewFilterDto filter);
        Task<PagedResult<ReviewResponseDto>> GetReviewsBySellerAsync(int sellerUserId, ReviewFilterDto filter);
        Task<PagedResult<ReviewResponseDto>> GetReviewsByBuyerAsync(int buyerUserId, ReviewFilterDto filter);
        Task<ReviewResponseDto?> GetReviewByIdAsync(int reviewId);
        Task<(bool Success, string Message, ReviewResponseDto? Data)> CreateReviewAsync(int buyerUserId, CreateReviewDto dto);
        Task<(bool Success, string Message)> ModerateReviewAsync(int reviewId, ModerateReviewDto dto, int adminUserId);
        Task<(bool Success, string Message)> DeleteReviewAsync(int reviewId);
    }
}
