namespace RecycleHub.API.DTOs.BuyerProfileDtos
{
    public class CreateBuyerProfileDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string IndustryType { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? WebsiteUrl { get; set; }
        public string? Description { get; set; }
    }

    public class UpdateBuyerProfileDto
    {
        public string? CompanyName { get; set; }
        public string? IndustryType { get; set; }
        public string? City { get; set; }
        public string? Address { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? Description { get; set; }
    }

    public class BuyerProfileResponseDto
    {
        public int BuyerProfileId { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string OwnerFullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string IndustryType { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? WebsiteUrl { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class BuyerProfileFilterDto
    {
        public string? SearchTerm { get; set; }
        public string? City { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
