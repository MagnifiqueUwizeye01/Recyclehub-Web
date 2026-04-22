namespace RecycleHub.API.Services.Interfaces
{
    public interface IEmailSender
    {
        /// <summary>Sends a one-time password for password reset. Throws on SMTP failure.</summary>
        Task SendPasswordResetOtpAsync(string toEmail, string plainOtp, CancellationToken cancellationToken = default);

        /// <param name="forSignIn">True after password at login; false when confirming 2FA enable in settings.</param>
        Task SendTwoFactorEmailOtpAsync(string toEmail, string plainOtp, bool forSignIn, CancellationToken cancellationToken = default);
    }
}
