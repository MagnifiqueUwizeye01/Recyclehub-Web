using RecycleHub.API.DTOs.AIAnalysisResultDtos;

namespace RecycleHub.API.Services.Interfaces
{
    public interface IAIAnalysisResultService
    {
        Task<List<AIAnalysisResultResponseDto>> GetResultsByMaterialAsync(int materialId);
        Task<AIAnalysisResultResponseDto?> GetResultByIdAsync(int analysisId);
        Task<(bool Success, string Message, AIAnalysisResultResponseDto? Data)> CreateResultAsync(CreateAIAnalysisResultDto dto);
        Task<(bool Success, string Message)> DeleteResultAsync(int analysisId);
    }
}
