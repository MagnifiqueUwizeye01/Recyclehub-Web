using RecycleHub.API.DTOs.Auth;

namespace RecycleHub.API.Services.Interfaces
{
    public interface IAuthService
    {
        Task<(bool Success, string Message, AuthResponseDto? Data)> RegisterAsync(RegisterRequestDto dto);
        Task<(bool Success, string Message, AuthResponseDto? Data)> LoginAsync(LoginRequestDto dto);
        Task<(bool Success, string Message, AuthResponseDto? Data)> CompleteTwoFactorLoginAsync(CompleteTwoFactorLoginDto dto, CancellationToken cancellationToken = default);
        Task<(bool Success, string Message, AuthResponseDto? Data)> RefreshTokenAsync(string refreshToken);
        Task<(bool Success, string Message)> RevokeTokenAsync(int userId);
        Task<(bool Success, string Message)> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
        Task<CurrentUserDto?> GetCurrentUserAsync(int userId);

        /// <summary>Sends a password-reset OTP email when the account exists and SMTP is configured.</summary>
        Task<(bool Success, string Message)> RequestPasswordResetOtpAsync(string email, CancellationToken cancellationToken = default);

        /// <summary>Completes reset after OTP verification.</summary>
        Task<(bool Success, string Message)> ResetPasswordWithOtpAsync(string email, string otp, string newPassword, CancellationToken cancellationToken = default);

        Task<(bool Success, string Message)> BeginTwoFactorSetupAsync(int userId, CancellationToken cancellationToken = default);
        Task<(bool Success, string Message)> ConfirmTwoFactorSetupAsync(int userId, string code, CancellationToken cancellationToken = default);
        Task<(bool Success, string Message)> DisableTwoFactorAsync(int userId, string password, CancellationToken cancellationToken = default);
        Task<(bool Success, string Message)> CancelTwoFactorSetupAsync(int userId, CancellationToken cancellationToken = default);
    }
}
