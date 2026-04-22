using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.DTOs.SellerProfileDtos
{
    public class CreateSellerProfileDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string LicenseDocument { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? WebsiteUrl { get; set; }
        public string? Description { get; set; }
    }

    public class UpdateSellerProfileDto
    {
        public string? CompanyName { get; set; }
        public string? LicenseDocument { get; set; }
        public string? City { get; set; }
        public string? Address { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? Description { get; set; }
    }

    public class VerifySellerProfileDto
    {
        /// <summary>'Verified' or 'Rejected'</summary>
        public VerificationStatus VerificationStatus { get; set; }
        public string? VerificationNote { get; set; }
    }

    public class SellerProfileResponseDto
    {
        public int SellerProfileId { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string OwnerFullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string LicenseDocument { get; set; } = string.Empty;
        public VerificationStatus VerificationStatus { get; set; }
        public string? VerificationNote { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public string City { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? WebsiteUrl { get; set; }
        public string? Description { get; set; }
        public int TotalSales { get; set; }
        public decimal AverageRating { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class SellerProfileFilterDto
    {
        public string? SearchTerm { get; set; }
        public VerificationStatus? VerificationStatus { get; set; }
        public string? City { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
