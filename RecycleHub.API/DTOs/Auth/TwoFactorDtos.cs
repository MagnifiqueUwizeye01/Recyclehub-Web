namespace RecycleHub.API.DTOs.Auth
{
    public class CompleteTwoFactorLoginDto
    {
        public string ChallengeToken { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }

    public class TwoFactorConfirmDto
    {
        /// <summary>6-digit code from the email we sent.</summary>
        public string Code { get; set; } = string.Empty;
    }

    public class TwoFactorDisableDto
    {
        public string Password { get; set; } = string.Empty;
    }
}
