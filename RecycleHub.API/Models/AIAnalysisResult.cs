namespace RecycleHub.API.Models
{
    /// <summary>Maps to dbo.AIAnalysisResults — RequestedByUserId FK to Users.</summary>
    public class AIAnalysisResult
    {
        public int AnalysisId { get; set; }
        public int MaterialId { get; set; }
        public int RequestedByUserId { get; set; }
        public string? DetectedType { get; set; }
        public string? PredictedGrade { get; set; }
        public decimal? ConfidenceScore { get; set; }
        public decimal? RecyclabilityScore { get; set; }
        public decimal? SuggestedPrice { get; set; }
        public string? Notes { get; set; }
        public string? RawAIResponse { get; set; }
        public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;

        // ── Navigation ────────────────────────────────────────────────────────
        public Material Material { get; set; } = null!;
        public User RequestedByUser { get; set; } = null!;
    }
}
