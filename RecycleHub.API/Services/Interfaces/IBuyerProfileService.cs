using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.BuyerProfileDtos;

namespace RecycleHub.API.Services.Interfaces
{
    public interface IBuyerProfileService
    {
        Task<PagedResult<BuyerProfileResponseDto>> GetAllBuyerProfilesAsync(BuyerProfileFilterDto filter);
        Task<BuyerProfileResponseDto?> GetBuyerProfileByIdAsync(int buyerProfileId);
        Task<BuyerProfileResponseDto?> GetBuyerProfileByUserIdAsync(int userId);
        Task<(bool Success, string Message, BuyerProfileResponseDto? Data)> CreateBuyerProfileAsync(int userId, CreateBuyerProfileDto dto);
        Task<(bool Success, string Message, BuyerProfileResponseDto? Data)> UpdateBuyerProfileAsync(int userId, UpdateBuyerProfileDto dto);
        Task<(bool Success, string Message)> DeleteBuyerProfileAsync(int userId);
    }
}
