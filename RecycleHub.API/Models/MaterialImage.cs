namespace RecycleHub.API.Models
{
    /// <summary>Maps to dbo.MaterialImages.</summary>
    public class MaterialImage
    {
        public int ImageId { get; set; }
        public int MaterialId { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsPrimary { get; set; } = false;
        public int SortOrder { get; set; } = 0;
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        // ── Navigation ────────────────────────────────────────────────────────
        public Material Material { get; set; } = null!;
    }
}
