using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.MaterialDtos;

namespace RecycleHub.API.Services.Interfaces
{
    public interface IMaterialService
    {
        Task<PagedResult<MaterialResponseDto>> GetAllMaterialsAsync(MaterialFilterDto filter);
        Task<MaterialResponseDto?> GetMaterialByIdAsync(int materialId);
        Task<PagedResult<MaterialResponseDto>> GetMaterialsBySellerAsync(int sellerUserId, MaterialFilterDto filter);
        Task<(bool Success, string Message, MaterialResponseDto? Data)> CreateMaterialAsync(int sellerUserId, CreateMaterialDto dto);
        Task<(bool Success, string Message, MaterialResponseDto? Data)> UpdateMaterialAsync(int materialId, UpdateMaterialDto dto);
        Task<(bool Success, string Message)> DeleteMaterialAsync(int materialId);
        Task<(bool Success, string Message)> SubmitForVerificationAsync(int materialId);
        Task<(bool Success, string Message)> VerifyMaterialAsync(int materialId, VerifyMaterialDto dto, int adminUserId);
        Task<(bool Success, string Message)> MarkAsSoldAsync(int materialId);
        Task IncrementViewCountAsync(int materialId);
    }
}
