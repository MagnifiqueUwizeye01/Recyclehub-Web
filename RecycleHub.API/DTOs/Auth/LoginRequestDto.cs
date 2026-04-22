using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.DTOs.Auth
{
    public class LoginRequestDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterRequestDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.MaxLength(60)]
        public string Username { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.EmailAddress]
        [System.ComponentModel.DataAnnotations.MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.MaxLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        public string? PhoneNumber { get; set; }

        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.Compare("Password", ErrorMessage = "Passwords do not match")]
        public string ConfirmPassword { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Required]
        public UserRole Role { get; set; } = UserRole.Buyer;

        [System.ComponentModel.DataAnnotations.Required]
        public Gender Gender { get; set; } = Gender.Male;

        // Buyer profile fields
        public string? CompanyName { get; set; }
        public string? IndustryType { get; set; }
        public string? City { get; set; }
        public string? Address { get; set; }
        // Seller extra
        public string? LicenseDocument { get; set; }
        public string? WebsiteUrl { get; set; }
    }

    public class AuthResponseDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime TokenExpiry { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public UserRole Role { get; set; }
        public string? ProfileImageUrl { get; set; }
        public int? BuyerProfileId { get; set; }
        public int? SellerProfileId { get; set; }

        /// <summary>True when password was valid but an email OTP is required to finish login.</summary>
        public bool RequiresTwoFactor { get; set; }

        /// <summary>Send with <see cref="CompleteTwoFactorLoginDto"/> to POST /auth/login/2fa.</summary>
        public string? TwoFactorChallengeToken { get; set; }
    }

    public class RefreshTokenRequestDto
    {
        public string RefreshToken { get; set; } = string.Empty;
    }
}
