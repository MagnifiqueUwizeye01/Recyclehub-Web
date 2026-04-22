using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.Models
{
    /// <summary>Maps to dbo.Users — SQL Server schema.</summary>
    public class User
    {
        public int UserId { get; set; }

        [System.ComponentModel.DataAnnotations.MaxLength(60)]
        public string Username { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        public Gender Gender { get; set; }

        [System.ComponentModel.DataAnnotations.MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.MaxLength(512)]
        public string PasswordHash { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.MaxLength(20)]
        public string? PhoneNumber { get; set; }

        public UserRole Role { get; set; }
        public UserStatus Status { get; set; } = UserStatus.Pending;

        [System.ComponentModel.DataAnnotations.MaxLength(500)]
        public string? ProfileImageUrl { get; set; }

        public DateTime? LastLoginAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // ── Refresh-token support (EF only — not in base SQL, added via migration) ──
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiry { get; set; }

        /// <summary>Hashed forgot-password OTP; null when no reset is in progress.</summary>
        [System.ComponentModel.DataAnnotations.MaxLength(256)]
        public string? PasswordResetOtpHash { get; set; }

        public DateTime? PasswordResetOtpExpiresAt { get; set; }

        /// <summary>When true, login requires a one-time code sent to <see cref="Email"/>.</summary>
        public bool TwoFactorEnabled { get; set; }

        /// <summary>Legacy column (TOTP); unused for email OTP — left nullable for existing databases.</summary>
        [System.ComponentModel.DataAnnotations.MaxLength(80)]
        public string? TwoFactorSecret { get; set; }

        /// <summary>Opaque token after password step when 2FA is required; cleared after second step completes or expires.</summary>
        [System.ComponentModel.DataAnnotations.MaxLength(256)]
        public string? TwoFactorLoginChallenge { get; set; }

        public DateTime? TwoFactorLoginChallengeExpiresAt { get; set; }

        /// <summary>Hashed 6-digit email OTP for the login second step.</summary>
        [System.ComponentModel.DataAnnotations.MaxLength(256)]
        public string? TwoFactorLoginEmailOtpHash { get; set; }

        public DateTime? TwoFactorLoginEmailOtpExpiresAt { get; set; }

        /// <summary>Hashed 6-digit email OTP while enabling 2FA (before <see cref="TwoFactorEnabled"/> is set).</summary>
        [System.ComponentModel.DataAnnotations.MaxLength(256)]
        public string? TwoFactorSetupEmailOtpHash { get; set; }

        public DateTime? TwoFactorSetupEmailOtpExpiresAt { get; set; }

        // ── Navigation ────────────────────────────────────────────────────────
        public BuyerProfile? BuyerProfile { get; set; }
        public SellerProfile? SellerProfile { get; set; }
    }
}
