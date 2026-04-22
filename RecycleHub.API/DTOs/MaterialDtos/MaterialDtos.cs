using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.DTOs.MaterialDtos
{
    public class CreateMaterialDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public MaterialType MaterialType { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string Unit { get; set; } = "kg";
        public decimal MinOrderQty { get; set; } = 1;
        public string City { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? Grade { get; set; }
        public bool IsSmartSwap { get; set; }
        public string? SmartSwapDescription { get; set; }
    }

    public class UpdateMaterialDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public decimal? Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public string? Unit { get; set; }
        public decimal? MinOrderQty { get; set; }
        public string? City { get; set; }
        public string? Address { get; set; }
        public string? Grade { get; set; }
        public bool? IsSmartSwap { get; set; }
        public string? SmartSwapDescription { get; set; }
    }

    public class VerifyMaterialDto
    {
        /// <summary>'Verified' | 'Rejected' | 'Available'</summary>
        public MaterialStatus Status { get; set; }
        public string? AdminNote { get; set; }
    }

    public class MaterialResponseDto
    {
        public int MaterialId { get; set; }
        public int SellerUserId { get; set; }
        public string SellerUsername { get; set; } = string.Empty;
        public string SellerCompanyName { get; set; } = string.Empty;
        public string SellerCity { get; set; } = string.Empty;
        /// <summary>True when the seller's profile has been verified by an admin.</summary>
        public bool SellerIsVerified { get; set; }
        public decimal SellerRating { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public MaterialType MaterialType { get; set; }
        public MaterialStatus Status { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal MinOrderQty { get; set; }
        public string City { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? Grade { get; set; }
        public string? AdminNote { get; set; }
        public int ViewCount { get; set; }
        public string? PrimaryImageUrl { get; set; }
        public List<string> ImageUrls { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public bool IsSmartSwap { get; set; }
        public string? SmartSwapDescription { get; set; }
    }

    public class MaterialFilterDto
    {
        public string? SearchTerm { get; set; }
        public MaterialType? MaterialType { get; set; }
        public MaterialStatus? Status { get; set; }
        public string? City { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public string? Grade { get; set; }
        public int? SellerUserId { get; set; }
        public bool? IsSmartSwap { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string SortBy { get; set; } = "CreatedAt";
        public bool SortDescending { get; set; } = true;
    }
}
