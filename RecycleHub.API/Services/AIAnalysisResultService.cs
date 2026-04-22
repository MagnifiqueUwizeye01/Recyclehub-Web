using Microsoft.EntityFrameworkCore;
using RecycleHub.API.Data;
using RecycleHub.API.DTOs.AIAnalysisResultDtos;
using RecycleHub.API.Models;
using RecycleHub.API.Services.Interfaces;

namespace RecycleHub.API.Services
{
    public class AIAnalysisResultService : IAIAnalysisResultService
    {
        private readonly AppDbContext _db;
        public AIAnalysisResultService(AppDbContext db) => _db = db;

        public async Task<List<AIAnalysisResultResponseDto>> GetResultsByMaterialAsync(int materialId) =>
            await _db.AIAnalysisResults
                .Include(a => a.RequestedByUser)
                .Include(a => a.Material)
                .Where(a => a.MaterialId == materialId)
                .OrderByDescending(a => a.AnalyzedAt)
                .Select(a => ToDto(a)).ToListAsync();

        public async Task<AIAnalysisResultResponseDto?> GetResultByIdAsync(int analysisId)
        {
            var a = await _db.AIAnalysisResults.Include(x => x.RequestedByUser).Include(x => x.Material)
                .FirstOrDefaultAsync(x => x.AnalysisId == analysisId);
            return a == null ? null : ToDto(a);
        }

        public async Task<(bool Success, string Message, AIAnalysisResultResponseDto? Data)> CreateResultAsync(CreateAIAnalysisResultDto dto)
        {
            var material = await _db.Materials.FindAsync(dto.MaterialId);
            if (material == null) return (false, "Material not found.", null);

            var result = new AIAnalysisResult
            {
                MaterialId = dto.MaterialId, RequestedByUserId = dto.RequestedByUserId,
                DetectedType = dto.DetectedType, PredictedGrade = dto.PredictedGrade,
                ConfidenceScore = dto.ConfidenceScore, RecyclabilityScore = dto.RecyclabilityScore,
                SuggestedPrice = dto.SuggestedPrice, Notes = dto.Notes, RawAIResponse = dto.RawAIResponse,
                AnalyzedAt = DateTime.UtcNow
            };
            _db.AIAnalysisResults.Add(result);

            // Auto-update material grade if predicted and not yet set
            if (!string.IsNullOrWhiteSpace(dto.PredictedGrade) && material.Grade == null)
            {
                material.Grade = dto.PredictedGrade;
                material.UpdatedAt = DateTime.UtcNow;
            }
            await _db.SaveChangesAsync();

            await _db.Entry(result).Reference(a => a.RequestedByUser).LoadAsync();
            await _db.Entry(result).Reference(a => a.Material).LoadAsync();
            return (true, "Analysis result saved.", ToDto(result));
        }

        public async Task<(bool Success, string Message)> DeleteResultAsync(int analysisId)
        {
            var a = await _db.AIAnalysisResults.FindAsync(analysisId);
            if (a == null) return (false, "Analysis result not found.");
            _db.AIAnalysisResults.Remove(a);
            await _db.SaveChangesAsync();
            return (true, "Analysis result deleted.");
        }

        private static AIAnalysisResultResponseDto ToDto(AIAnalysisResult a) => new()
        {
            AnalysisId           = a.AnalysisId,
            MaterialId           = a.MaterialId,
            MaterialTitle        = a.Material?.Title ?? "",
            RequestedByUserId    = a.RequestedByUserId,
            RequestedByUsername  = a.RequestedByUser?.Username ?? "",
            DetectedType         = a.DetectedType,
            PredictedGrade       = a.PredictedGrade,
            ConfidenceScore      = a.ConfidenceScore,
            RecyclabilityScore   = a.RecyclabilityScore,
            SuggestedPrice       = a.SuggestedPrice,
            Notes                = a.Notes,
            AnalyzedAt           = a.AnalyzedAt
        };
    }
}
