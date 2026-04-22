using RecycleHub.API.DTOs.MaterialImageDtos;
using Microsoft.AspNetCore.Http;

namespace RecycleHub.API.Services.Interfaces
{
    public interface IMaterialImageService
    {
        Task<List<MaterialImageResponseDto>> GetImagesByMaterialAsync(int materialId);
        Task<(bool Success, string Message, MaterialImageResponseDto? Data)> UploadImageAsync(int materialId, IFormFile file, string webRootPath, bool isPrimary);
        Task<(bool Success, string Message)> DeleteImageAsync(int imageId, string webRootPath);
        Task<(bool Success, string Message)> SetCoverImageAsync(int imageId);
    }
}
