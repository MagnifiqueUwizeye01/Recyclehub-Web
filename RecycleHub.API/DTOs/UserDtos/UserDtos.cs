using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.DTOs.UserDtos
{
    public class UpdateUserDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public Gender? Gender { get; set; }
        public string? ProfileImageUrl { get; set; }
        public UserStatus? Status { get; set; }

        /// <summary>Admin-only updates (ignored for non-admin callers).</summary>
        public string? Email { get; set; }

        public string? Username { get; set; }
        public UserRole? Role { get; set; }
    }

    /// <summary>Admin creates a platform user (password set by admin).</summary>
    public class CreateUserByAdminDto
    {
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public Gender Gender { get; set; } = Gender.Male;
        public string? PhoneNumber { get; set; }

        /// <summary>Optional; used for buyer/seller profile defaults.</summary>
        public string? CompanyName { get; set; }

        public string? City { get; set; }
        public string? Address { get; set; }
    }

    public class UserResponseDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName => $"{FirstName} {LastName}";
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public UserRole Role { get; set; }
        public UserStatus Status { get; set; }
        public Gender Gender { get; set; }
        public string? ProfileImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }

    public class UserFilterDto
    {
        public string? SearchTerm { get; set; }
        public UserRole? Role { get; set; }
        public UserStatus? Status { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
