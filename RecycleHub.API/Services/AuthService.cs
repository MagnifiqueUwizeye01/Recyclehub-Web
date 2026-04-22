using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Common.Settings;
using RecycleHub.API.Data;
using RecycleHub.API.DTOs.Auth;
using RecycleHub.API.Helpers;
using RecycleHub.API.Models;
using RecycleHub.API.Services.Interfaces;

namespace RecycleHub.API.Services
{
    public class AuthService : IAuthService
    {
        public const string ForgotPasswordPublicMessage =
            "If an account exists for this email, you will receive a reset code shortly.";

        private readonly AppDbContext _db;
        private readonly JwtTokenGenerator _jwt;
        private readonly IEmailSender _emailSender;
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<AuthService> _logger;
        private readonly IHostEnvironment _env;

        public AuthService(
            AppDbContext db,
            JwtTokenGenerator jwt,
            IEmailSender emailSender,
            IOptions<EmailSettings> emailSettings,
            ILogger<AuthService> logger,
            IHostEnvironment env)
        {
            _db = db;
            _jwt = jwt;
            _emailSender = emailSender;
            _emailSettings = emailSettings.Value;
            _logger = logger;
            _env = env;
        }

        public async Task<(bool Success, string Message, AuthResponseDto? Data)> RegisterAsync(RegisterRequestDto dto)
        {
            if (dto.Password != dto.ConfirmPassword)
                return (false, "Passwords do not match.", null);

            var existingUser = await _db.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email || u.Username == dto.Username);

            if (existingUser != null)
            {
                if (string.Equals(existingUser.Email, dto.Email, StringComparison.OrdinalIgnoreCase))
                    return (false, "An account with this email address already exists. Each email can only be associated with one role on RecycleHub.", null);
                if (string.Equals(existingUser.Username, dto.Username, StringComparison.OrdinalIgnoreCase))
                    return (false, "This username is already taken. Please choose a different username.", null);
            }

            // All new accounts are Active at signup; buyers never require admin activation.
            // Seller *profiles* stay Pending until an admin verifies license documents (see SellerProfile.VerificationStatus).
            var user = new User
            {
                Username = dto.Username,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                Gender = dto.Gender,
                Role = dto.Role,
                Status = UserStatus.Active,
                PasswordHash = PasswordHasher.Hash(dto.Password),
                CreatedAt = DateTime.UtcNow
            };

            try
            {
                _db.Users.Add(user);
                await _db.SaveChangesAsync();

                // Auto-create profile
                if (dto.Role == UserRole.Buyer)
                {
                    var bp = new BuyerProfile
                    {
                        UserId      = user.UserId,
                        CompanyName = dto.CompanyName ?? $"{user.FirstName}'s Business",
                        IndustryType= dto.IndustryType ?? "General",
                        City        = dto.City ?? "Unknown",
                        Address     = dto.Address ?? "Unknown",
                        CreatedAt   = DateTime.UtcNow
                    };
                    _db.BuyerProfiles.Add(bp);
                    user.BuyerProfile = bp;
                }
                else if (dto.Role == UserRole.Seller)
                {
                    var sp = new SellerProfile
                    {
                        UserId           = user.UserId,
                        CompanyName      = dto.CompanyName ?? $"{user.FirstName}'s Store",
                        LicenseDocument  = string.IsNullOrWhiteSpace(dto.LicenseDocument) ? "pending_license.pdf" : dto.LicenseDocument.Trim(),
                        City             = dto.City ?? "Unknown",
                        Address          = dto.Address ?? "Unknown",
                        VerificationStatus = VerificationStatus.Pending,
                        CreatedAt        = DateTime.UtcNow
                    };
                    _db.SellerProfiles.Add(sp);
                    user.SellerProfile = sp;
                }

                await _db.SaveChangesAsync();

                var (token, refreshToken, expiry) = _jwt.GenerateTokens(user);
                
                user.RefreshToken = refreshToken;
                user.RefreshTokenExpiry = expiry;
                await _db.SaveChangesAsync();

                return (true, "Registration successful.", BuildAuthResponse(user, token, refreshToken, expiry));
            }
            catch (DbUpdateException ex) when (ex.InnerException is Microsoft.Data.SqlClient.SqlException sqlEx && (sqlEx.Number == 2627 || sqlEx.Number == 2601))
            {
                return (false, "Email or username already exists.", null);
            }
            catch (DbUpdateException ex) when (ex.InnerException is Microsoft.Data.SqlClient.SqlException sqlEx && sqlEx.Number == 2628)
            {
                return (false, "One or more fields exceed maximum allowed length. Please check your inputs.", null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during registration");
                return (false, "An unexpected error occurred during registration. " + ex.Message, null);
            }
        }

        public async Task<(bool Success, string Message, AuthResponseDto? Data)> LoginAsync(LoginRequestDto dto)
        {
            var user = await _db.Users
                .Include(u => u.BuyerProfile)
                .Include(u => u.SellerProfile)
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null)
                return (false, "Invalid email or password.", null);

            var passwordOk = false;
            if (!string.IsNullOrEmpty(user.PasswordHash))
            {
                try
                {
                    passwordOk = PasswordHasher.Verify(dto.Password, user.PasswordHash);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Password hash verification failed for {Email}", dto.Email);
                    passwordOk = false;
                }
            }

            if (!passwordOk)
                return (false, "Invalid email or password.", null);

            if (user.Status == UserStatus.Suspended)
                return (false, "Your account has been suspended. Please contact support.", null);

            // Buyers register as Active; older or imported rows may still be Pending — activate on login (no admin step).
            if (user.Role == UserRole.Buyer && user.Status == UserStatus.Pending)
            {
                user.Status = UserStatus.Active;
                user.UpdatedAt = DateTime.UtcNow;
            }

            if (user.TwoFactorEnabled)
            {
                if (!IsSmtpConfigured())
                {
                    _logger.LogWarning("2FA login for {Email} blocked: SMTP not configured.", dto.Email);
                    if (_env.IsDevelopment())
                        return (false, "Two-factor authentication requires email. Configure Email:SmtpUser and Email:SmtpPassword in appsettings.", null);
                    return (false, "Sign-in is temporarily unavailable. Please try again later.", null);
                }

                var otp = GenerateSixDigitOtp();
                var hash = PasswordHasher.Hash(otp);
                var expires = DateTime.UtcNow.AddMinutes(Math.Clamp(_emailSettings.OtpExpiryMinutes, 5, 120));
                var challenge = GenerateLoginChallengeToken();

                user.TwoFactorLoginChallenge = challenge;
                user.TwoFactorLoginChallengeExpiresAt = DateTime.UtcNow.AddMinutes(10);
                user.TwoFactorLoginEmailOtpHash = hash;
                user.TwoFactorLoginEmailOtpExpiresAt = expires;
                user.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync().ConfigureAwait(false);

                try
                {
                    await _emailSender.SendTwoFactorEmailOtpAsync(user.Email, otp, forSignIn: true, CancellationToken.None)
                        .ConfigureAwait(false);
                }
                catch (Exception ex)
                {
                    user.TwoFactorLoginChallenge = null;
                    user.TwoFactorLoginChallengeExpiresAt = null;
                    user.TwoFactorLoginEmailOtpHash = null;
                    user.TwoFactorLoginEmailOtpExpiresAt = null;
                    user.UpdatedAt = DateTime.UtcNow;
                    await _db.SaveChangesAsync().ConfigureAwait(false);
                    _logger.LogError(ex, "Failed to send 2FA login email to {Email}", user.Email);
                    if (_env.IsDevelopment())
                        return (false, $"Could not send sign-in code (SMTP). {ex.Message}", null);
                    return (false, "Could not send sign-in code. Please try again later.", null);
                }

                return (true, "We sent a 6-digit code to your email. Enter it to finish signing in.",
                    BuildTwoFactorChallengeResponse(user, challenge));
            }

            var (token, refreshToken, expiry) = _jwt.GenerateTokens(user);
            user.RefreshToken       = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            user.LastLoginAt        = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return (true, "Login successful.", BuildAuthResponse(user, token, refreshToken, expiry));
        }

        public async Task<(bool Success, string Message, AuthResponseDto? Data)> CompleteTwoFactorLoginAsync(
            CompleteTwoFactorLoginDto dto,
            CancellationToken cancellationToken = default)
        {
            var token = (dto.ChallengeToken ?? string.Empty).Trim();
            var code = (dto.Code ?? string.Empty).Trim().Replace(" ", "", StringComparison.Ordinal);
            if (string.IsNullOrEmpty(token) || code.Length != 6 || !code.All(char.IsDigit))
                return (false, "Invalid challenge or code.", null);

            var user = await _db.Users
                .Include(u => u.BuyerProfile)
                .Include(u => u.SellerProfile)
                .FirstOrDefaultAsync(
                    u => u.TwoFactorLoginChallenge == token && u.TwoFactorLoginChallengeExpiresAt > DateTime.UtcNow,
                    cancellationToken)
                .ConfigureAwait(false);

            if (user == null)
                return (false, "Invalid or expired login session. Please sign in again.", null);

            if (!user.TwoFactorEnabled)
                return (false, "Two-factor authentication is not active for this account.", null);

            if (string.IsNullOrEmpty(user.TwoFactorLoginEmailOtpHash) || !user.TwoFactorLoginEmailOtpExpiresAt.HasValue)
                return (false, "Invalid or expired sign-in session. Please sign in again.", null);

            if (user.TwoFactorLoginEmailOtpExpiresAt.Value < DateTime.UtcNow)
                return (false, "That code has expired. Please sign in again.", null);

            if (!PasswordHasher.Verify(code, user.TwoFactorLoginEmailOtpHash))
                return (false, "Invalid code. Check the email we sent you.", null);

            user.TwoFactorLoginChallenge = null;
            user.TwoFactorLoginChallengeExpiresAt = null;
            user.TwoFactorLoginEmailOtpHash = null;
            user.TwoFactorLoginEmailOtpExpiresAt = null;

            if (user.Role == UserRole.Buyer && user.Status == UserStatus.Pending)
            {
                user.Status = UserStatus.Active;
                user.UpdatedAt = DateTime.UtcNow;
            }

            var (accessToken, refreshToken, expiry) = _jwt.GenerateTokens(user);
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            user.LastLoginAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            return (true, "Login successful.", BuildAuthResponse(user, accessToken, refreshToken, expiry));
        }

        public async Task<(bool Success, string Message, AuthResponseDto? Data)> RefreshTokenAsync(string refreshToken)
        {
            var user = await _db.Users
                .Include(u => u.BuyerProfile)
                .Include(u => u.SellerProfile)
                .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken && u.RefreshTokenExpiry > DateTime.UtcNow);

            if (user == null)
                return (false, "Invalid or expired refresh token.", null);

            if (user.Role == UserRole.Buyer && user.Status == UserStatus.Pending)
            {
                user.Status = UserStatus.Active;
                user.UpdatedAt = DateTime.UtcNow;
            }

            var (token, newRefreshToken, expiry) = _jwt.GenerateTokens(user);
            user.RefreshToken       = newRefreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            await _db.SaveChangesAsync();

            return (true, "Token refreshed.", BuildAuthResponse(user, token, newRefreshToken, expiry));
        }

        public async Task<(bool Success, string Message)> RevokeTokenAsync(int userId)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return (false, "User not found.");
            user.RefreshToken       = null;
            user.RefreshTokenExpiry = null;
            await _db.SaveChangesAsync();
            return (true, "Logged out successfully.");
        }

        public async Task<(bool Success, string Message)> ChangePasswordAsync(int userId, string currentPassword, string newPassword)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return (false, "User not found.");
            if (!PasswordHasher.Verify(currentPassword, user.PasswordHash))
                return (false, "Current password is incorrect.");
            user.PasswordHash = PasswordHasher.Hash(newPassword);
            user.UpdatedAt    = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, "Password changed successfully.");
        }

        public async Task<CurrentUserDto?> GetCurrentUserAsync(int userId)
        {
            var user = await _db.Users
                .AsNoTracking()
                .Include(u => u.BuyerProfile)
                .Include(u => u.SellerProfile)
                .FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null) return null;
            return new CurrentUserDto
            {
                UserId          = user.UserId,
                Username        = user.Username,
                FirstName       = user.FirstName,
                LastName        = user.LastName,
                Email           = user.Email,
                PhoneNumber     = user.PhoneNumber,
                Gender          = user.Gender,
                Role            = user.Role,
                ProfileImageUrl = user.ProfileImageUrl,
                BuyerProfileId  = user.BuyerProfile?.BuyerProfileId,
                SellerProfileId = user.SellerProfile?.SellerProfileId,
                TwoFactorEnabled = user.TwoFactorEnabled
            };
        }

        public async Task<(bool Success, string Message)> BeginTwoFactorSetupAsync(
            int userId,
            CancellationToken cancellationToken = default)
        {
            var user = await _db.Users.FindAsync(new object[] { userId }, cancellationToken).ConfigureAwait(false);
            if (user == null)
                return (false, "User not found.");
            if (user.TwoFactorEnabled)
                return (false, "Two-factor authentication is already enabled. Turn it off first if you want to change it.");

            if (!IsSmtpConfigured())
            {
                if (_env.IsDevelopment())
                    return (false, "Email is not configured. Set Email:SmtpUser and Email:SmtpPassword in appsettings.");
                return (false, "Email is not configured. Contact support.");
            }

            var otp = GenerateSixDigitOtp();
            var hash = PasswordHasher.Hash(otp);
            var expires = DateTime.UtcNow.AddMinutes(Math.Clamp(_emailSettings.OtpExpiryMinutes, 5, 120));

            user.TwoFactorSetupEmailOtpHash = hash;
            user.TwoFactorSetupEmailOtpExpiresAt = expires;
            user.TwoFactorSecret = null;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            try
            {
                await _emailSender.SendTwoFactorEmailOtpAsync(user.Email, otp, forSignIn: false, cancellationToken)
                    .ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                user.TwoFactorSetupEmailOtpHash = null;
                user.TwoFactorSetupEmailOtpExpiresAt = null;
                user.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
                _logger.LogError(ex, "Failed to send 2FA setup email to user {UserId}", userId);
                if (_env.IsDevelopment())
                    return (false, $"Could not send email (SMTP). {ex.Message}");
                return (false, "Could not send verification email. Please try again later.");
            }

            return (true, "We sent a 6-digit code to your email. Enter it below to turn on two-factor authentication.");
        }

        public async Task<(bool Success, string Message)> ConfirmTwoFactorSetupAsync(
            int userId,
            string code,
            CancellationToken cancellationToken = default)
        {
            var user = await _db.Users.FindAsync(new object[] { userId }, cancellationToken).ConfigureAwait(false);
            if (user == null)
                return (false, "User not found.");
            if (user.TwoFactorEnabled)
                return (false, "Two-factor authentication is already enabled.");
            if (string.IsNullOrEmpty(user.TwoFactorSetupEmailOtpHash) || !user.TwoFactorSetupEmailOtpExpiresAt.HasValue)
                return (false, "Request a new code first (use Enable two-factor authentication again).");

            if (user.TwoFactorSetupEmailOtpExpiresAt.Value < DateTime.UtcNow)
                return (false, "That code has expired. Request a new code.");

            if (!PasswordHasher.Verify(code.Trim(), user.TwoFactorSetupEmailOtpHash))
                return (false, "Invalid code. Check the email we sent you.");

            user.TwoFactorEnabled = true;
            user.TwoFactorSetupEmailOtpHash = null;
            user.TwoFactorSetupEmailOtpExpiresAt = null;
            user.TwoFactorSecret = null;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            return (true, "Two-factor authentication is on. We will email you a code each time you sign in.");
        }

        public async Task<(bool Success, string Message)> DisableTwoFactorAsync(
            int userId,
            string password,
            CancellationToken cancellationToken = default)
        {
            var user = await _db.Users.FindAsync(new object[] { userId }, cancellationToken).ConfigureAwait(false);
            if (user == null)
                return (false, "User not found.");
            if (!PasswordHasher.Verify(password, user.PasswordHash))
                return (false, "Password is incorrect.");

            user.TwoFactorEnabled = false;
            user.TwoFactorSecret = null;
            user.TwoFactorLoginChallenge = null;
            user.TwoFactorLoginChallengeExpiresAt = null;
            user.TwoFactorLoginEmailOtpHash = null;
            user.TwoFactorLoginEmailOtpExpiresAt = null;
            user.TwoFactorSetupEmailOtpHash = null;
            user.TwoFactorSetupEmailOtpExpiresAt = null;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            return (true, "Two-factor authentication has been turned off.");
        }

        public async Task<(bool Success, string Message)> CancelTwoFactorSetupAsync(int userId, CancellationToken cancellationToken = default)
        {
            var user = await _db.Users.FindAsync(new object[] { userId }, cancellationToken).ConfigureAwait(false);
            if (user == null)
                return (false, "User not found.");
            if (user.TwoFactorEnabled)
                return (false, "Use “Turn off” to disable two-factor authentication.");

            user.TwoFactorSetupEmailOtpHash = null;
            user.TwoFactorSetupEmailOtpExpiresAt = null;
            user.TwoFactorSecret = null;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            return (true, "Setup cancelled.");
        }

        public async Task<(bool Success, string Message)> RequestPasswordResetOtpAsync(string email, CancellationToken cancellationToken = default)
        {
            var trimmed = email.Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
                return (false, "Email is required.");

            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == trimmed.ToLowerInvariant(), cancellationToken)
                .ConfigureAwait(false);

            if (user == null)
                return (true, ForgotPasswordPublicMessage);

            if (!IsSmtpConfigured())
            {
                _logger.LogWarning("Password reset requested but Email:SmtpUser / Email:SmtpPassword are not configured in appsettings.");
                if (_env.IsDevelopment())
                    return (false, "Email is not configured. Set Email:SmtpUser and Email:SmtpPassword in appsettings.json (Gmail: use an App Password).");
                return (true, ForgotPasswordPublicMessage);
            }

            var otp = GenerateSixDigitOtp();
            var hash = PasswordHasher.Hash(otp);
            var expires = DateTime.UtcNow.AddMinutes(Math.Clamp(_emailSettings.OtpExpiryMinutes, 5, 120));

            // No manual transaction: EnableRetryOnFailure + BeginTransactionAsync breaks SqlServerRetryingExecutionStrategy.
            user.PasswordResetOtpHash = hash;
            user.PasswordResetOtpExpiresAt = expires;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            try
            {
                await _emailSender.SendPasswordResetOtpAsync(user.Email, otp, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                user.PasswordResetOtpHash = null;
                user.PasswordResetOtpExpiresAt = null;
                user.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
                _logger.LogError(ex, "Failed to send password reset email to {Email}", trimmed);
                if (_env.IsDevelopment())
                    return (false, $"Could not send email (SMTP / Gmail). {ex.Message}");
                return (true, ForgotPasswordPublicMessage);
            }

            return (true, ForgotPasswordPublicMessage);
        }

        public async Task<(bool Success, string Message)> ResetPasswordWithOtpAsync(
            string email,
            string otp,
            string newPassword,
            CancellationToken cancellationToken = default)
        {
            var trimmedEmail = email.Trim();
            var trimmedOtp = (otp ?? string.Empty).Trim().Replace(" ", "", StringComparison.Ordinal);

            if (string.IsNullOrWhiteSpace(trimmedEmail) || string.IsNullOrWhiteSpace(trimmedOtp) || string.IsNullOrWhiteSpace(newPassword))
                return (false, "Invalid or expired code.");

            if (trimmedOtp.Length != 6 || !trimmedOtp.All(char.IsDigit))
                return (false, "Invalid or expired code.");

            if (newPassword.Length < 8)
                return (false, "Password must be at least 8 characters.");

            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == trimmedEmail.ToLowerInvariant(), cancellationToken)
                .ConfigureAwait(false);

            if (user == null
                || string.IsNullOrEmpty(user.PasswordResetOtpHash)
                || !user.PasswordResetOtpExpiresAt.HasValue)
                return (false, "Invalid or expired code.");

            if (user.PasswordResetOtpExpiresAt.Value < DateTime.UtcNow)
                return (false, "Invalid or expired code.");

            if (!PasswordHasher.Verify(trimmedOtp, user.PasswordResetOtpHash))
                return (false, "Invalid or expired code.");

            user.PasswordHash = PasswordHasher.Hash(newPassword);
            user.PasswordResetOtpHash = null;
            user.PasswordResetOtpExpiresAt = null;
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            return (true, "Password has been reset. You can sign in with your new password.");
        }

        private bool IsSmtpConfigured() =>
            !string.IsNullOrWhiteSpace(_emailSettings.SmtpUser) && !string.IsNullOrWhiteSpace(_emailSettings.SmtpPassword);

        private static string GenerateSixDigitOtp() => Random.Shared.Next(0, 1_000_000).ToString("D6");

        private static string GenerateLoginChallengeToken()
        {
            var bytes = new byte[32];
            RandomNumberGenerator.Fill(bytes);
            return Convert.ToBase64String(bytes);
        }

        // ── Helper ────────────────────────────────────────────────────────
        private static AuthResponseDto BuildTwoFactorChallengeResponse(User u, string challengeToken) => new()
        {
            AccessToken               = string.Empty,
            RefreshToken              = string.Empty,
            TokenExpiry               = default,
            UserId                    = u.UserId,
            Username                  = u.Username,
            FullName                  = $"{u.FirstName} {u.LastName}",
            Email                     = u.Email,
            PhoneNumber               = u.PhoneNumber,
            Role                      = u.Role,
            ProfileImageUrl           = u.ProfileImageUrl,
            BuyerProfileId            = u.BuyerProfile?.BuyerProfileId,
            SellerProfileId           = u.SellerProfile?.SellerProfileId,
            RequiresTwoFactor         = true,
            TwoFactorChallengeToken   = challengeToken
        };

        private static AuthResponseDto BuildAuthResponse(User u, string token, string refreshToken, DateTime expiry) => new()
        {
            AccessToken      = token,
            RefreshToken     = refreshToken,
            TokenExpiry      = expiry,
            UserId           = u.UserId,
            Username         = u.Username,
            FullName         = $"{u.FirstName} {u.LastName}",
            Email            = u.Email,
            PhoneNumber      = u.PhoneNumber,
            Role             = u.Role,
            ProfileImageUrl  = u.ProfileImageUrl,
            BuyerProfileId   = u.BuyerProfile?.BuyerProfileId,
            SellerProfileId  = u.SellerProfile?.SellerProfileId,
            RequiresTwoFactor = false,
            TwoFactorChallengeToken = null
        };
    }
}
