using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.Models
{
    /// <summary>Maps to dbo.Materials — FK is SellerUserId (Users), no Brand/Condition/Tags.</summary>
    public class Material
    {
        public int MaterialId { get; set; }
        public int SellerUserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public MaterialType MaterialType { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal MinOrderQty { get; set; } = 1;
        public string City { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? Grade { get; set; }
        public MaterialStatus Status { get; set; } = MaterialStatus.Available;
        public string? AdminNote { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public int? VerifiedByAdminId { get; set; }
        public int ViewCount { get; set; } = 0;
        public bool IsSmartSwap { get; set; } = false;
        public string? SmartSwapDescription { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // ── Navigation ────────────────────────────────────────────────────────
        public User SellerUser { get; set; } = null!;
        public User? VerifiedByAdmin { get; set; }
        public ICollection<MaterialImage> Images { get; set; } = new List<MaterialImage>();
        public ICollection<AIAnalysisResult> AIAnalysisResults { get; set; } = new List<AIAnalysisResult>();
    }
}
