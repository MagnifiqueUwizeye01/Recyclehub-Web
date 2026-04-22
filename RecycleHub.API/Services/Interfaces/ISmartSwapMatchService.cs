using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.SmartSwapMatchDtos;

namespace RecycleHub.API.Services.Interfaces
{
    public interface ISmartSwapMatchService
    {
        Task<PagedResult<SmartSwapMatchResponseDto>> GetMatchesForBuyerAsync(int buyerUserId, int page, int pageSize);
        Task<PagedResult<SmartSwapMatchResponseDto>> GetMatchesForSellerAsync(int sellerUserId, int page, int pageSize);
        Task<SmartSwapMatchResponseDto?> GetMatchByIdAsync(int matchId);
        Task<(bool Success, string Message, SmartSwapMatchResponseDto? Data)> CreateMatchAsync(CreateSmartSwapMatchDto dto);
        Task<(bool Success, string Message)> UpdateMatchStatusAsync(int matchId, UpdateMatchStatusDto dto);
        Task<List<SmartSwapMatchResponseDto>> GenerateMatchesForMaterialAsync(int materialId);
    }
}
