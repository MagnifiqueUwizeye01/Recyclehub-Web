using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.DTOs.Auth
{
    /// <summary>Returned by GET /api/auth/me for session restore.</summary>
    public class CurrentUserDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public Gender Gender { get; set; }
        public UserRole Role { get; set; }
        public string? ProfileImageUrl { get; set; }
        public int? BuyerProfileId { get; set; }
        public int? SellerProfileId { get; set; }

        public bool TwoFactorEnabled { get; set; }
    }
}
