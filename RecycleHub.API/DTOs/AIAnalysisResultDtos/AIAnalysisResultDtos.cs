namespace RecycleHub.API.DTOs.AIAnalysisResultDtos
{
    public class CreateAIAnalysisResultDto
    {
        public int MaterialId { get; set; }
        public int RequestedByUserId { get; set; }
        public string? DetectedType { get; set; }
        public string? PredictedGrade { get; set; }
        public decimal? ConfidenceScore { get; set; }
        public decimal? RecyclabilityScore { get; set; }
        public decimal? SuggestedPrice { get; set; }
        public string? Notes { get; set; }
        public string? RawAIResponse { get; set; }
    }

    public class AIAnalysisResultResponseDto
    {
        public int AnalysisId { get; set; }
        public int MaterialId { get; set; }
        public string MaterialTitle { get; set; } = string.Empty;
        public int RequestedByUserId { get; set; }
        public string RequestedByUsername { get; set; } = string.Empty;
        public string? DetectedType { get; set; }
        public string? PredictedGrade { get; set; }
        public decimal? ConfidenceScore { get; set; }
        public decimal? RecyclabilityScore { get; set; }
        public decimal? SuggestedPrice { get; set; }
        public string? Notes { get; set; }
        public DateTime AnalyzedAt { get; set; }
    }
}
