using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.CertificateDtos;
using RecycleHub.API.DTOs.SellerProfileDtos;

namespace RecycleHub.API.Services.Interfaces
{
    public interface ISellerProfileService
    {
        Task<PagedResult<SellerProfileResponseDto>> GetAllSellerProfilesAsync(SellerProfileFilterDto filter);
        Task<SellerProfileResponseDto?> GetSellerProfileByIdAsync(int sellerProfileId);
        Task<SellerProfileResponseDto?> GetSellerProfileByUserIdAsync(int userId);
        Task<PublicSellerProfileDto?> GetPublicSellerProfileAsync(int userId);
        Task<(bool Success, string Message, SellerProfileResponseDto? Data)> CreateSellerProfileAsync(int userId, CreateSellerProfileDto dto);
        Task<(bool Success, string Message, SellerProfileResponseDto? Data)> UpdateSellerProfileAsync(int userId, UpdateSellerProfileDto dto);
        Task<(bool Success, string Message)> VerifySellerProfileAsync(int userId, VerifySellerProfileDto dto, int adminUserId);
        Task<(bool Success, string Message)> DeleteSellerProfileAsync(int userId);
        Task UpdateSellerStatsAsync(int sellerUserId);
    }
}
