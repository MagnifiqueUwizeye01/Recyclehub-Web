namespace RecycleHub.API.Common.Settings
{
    /// <summary>Gmail (or other) SMTP. Set <see cref="SmtpUser"/> and <see cref="SmtpPassword"/> via user-secrets or environment — never commit real credentials.</summary>
    public class EmailSettings
    {
        public const string SectionName = "Email";

        public string SmtpHost { get; set; } = "smtp.gmail.com";
        public int SmtpPort { get; set; } = 587;

        /// <summary>Full Gmail address for SMTP auth (same account that generated the app password).</summary>
        public string SmtpUser { get; set; } = "";

        /// <summary>Gmail app password (16 chars, spaces optional).</summary>
        public string SmtpPassword { get; set; } = "";

        /// <summary>From header; if empty, <see cref="SmtpUser"/> is used.</summary>
        public string FromAddress { get; set; } = "";

        public string FromName { get; set; } = "RecycleHub";

        /// <summary>OTP validity window.</summary>
        public int OtpExpiryMinutes { get; set; } = 15;
    }
}
