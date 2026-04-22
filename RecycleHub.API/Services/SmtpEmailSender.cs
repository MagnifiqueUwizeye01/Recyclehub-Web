using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using RecycleHub.API.Common.Settings;
using RecycleHub.API.Services.Interfaces;

namespace RecycleHub.API.Services
{
    public class SmtpEmailSender : IEmailSender
    {
        private readonly EmailSettings _opt;
        private readonly ILogger<SmtpEmailSender> _logger;

        public SmtpEmailSender(IOptions<EmailSettings> options, ILogger<SmtpEmailSender> logger)
        {
            _opt = options.Value;
            _logger = logger;
        }

        public async Task SendPasswordResetOtpAsync(string toEmail, string plainOtp, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_opt.SmtpUser) || string.IsNullOrWhiteSpace(_opt.SmtpPassword))
                throw new InvalidOperationException("Email SMTP is not configured. Set Email:SmtpUser and Email:SmtpPassword (e.g. dotnet user-secrets).");

            var from = string.IsNullOrWhiteSpace(_opt.FromAddress) ? _opt.SmtpUser.Trim() : _opt.FromAddress.Trim();

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_opt.FromName.Trim(), from));
            message.To.Add(MailboxAddress.Parse(toEmail.Trim()));
            message.Subject = "Your RecycleHub password reset code";

            var body = new BodyBuilder
            {
                TextBody =
                    $"Your password reset code is: {plainOtp}\n\n" +
                    $"This code expires in {_opt.OtpExpiryMinutes} minutes.\n\n" +
                    "If you did not request a reset, you can ignore this email.",
                HtmlBody =
                    $"<p>Your password reset code is:</p>" +
                    $"<p style=\"font-size:1.5rem;font-weight:700;letter-spacing:0.2em;\">{System.Net.WebUtility.HtmlEncode(plainOtp)}</p>" +
                    $"<p>This code expires in <strong>{_opt.OtpExpiryMinutes}</strong> minutes.</p>" +
                    "<p>If you did not request a reset, you can ignore this email.</p>",
            };
            message.Body = body.ToMessageBody();

            using var client = new SmtpClient();
            client.Timeout = (int)TimeSpan.FromSeconds(30).TotalMilliseconds;

            await client.ConnectAsync(_opt.SmtpHost, _opt.SmtpPort, SecureSocketOptions.StartTls, cancellationToken)
                .ConfigureAwait(false);
            try
            {
                await client.AuthenticateAsync(_opt.SmtpUser.Trim(), _opt.SmtpPassword.Replace(" ", "").Trim(), cancellationToken)
                    .ConfigureAwait(false);
                await client.SendAsync(message, cancellationToken).ConfigureAwait(false);
            }
            finally
            {
                if (client.IsConnected)
                    await client.DisconnectAsync(true, cancellationToken).ConfigureAwait(false);
            }

            _logger.LogInformation("Password reset OTP email sent to {Email}", toEmail);
        }

        public async Task SendTwoFactorEmailOtpAsync(string toEmail, string plainOtp, bool forSignIn, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_opt.SmtpUser) || string.IsNullOrWhiteSpace(_opt.SmtpPassword))
                throw new InvalidOperationException("Email SMTP is not configured. Set Email:SmtpUser and Email:SmtpPassword (e.g. dotnet user-secrets).");

            var from = string.IsNullOrWhiteSpace(_opt.FromAddress) ? _opt.SmtpUser.Trim() : _opt.FromAddress.Trim();
            var subject = forSignIn
                ? "Your RecycleHub sign-in verification code"
                : "Your RecycleHub two-factor setup code";

            var intro = forSignIn
                ? "Use this code to finish signing in to RecycleHub (after entering your password):"
                : "Use this code to confirm turning on email two-factor authentication for your RecycleHub account:";

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_opt.FromName.Trim(), from));
            message.To.Add(MailboxAddress.Parse(toEmail.Trim()));
            message.Subject = subject;

            var body = new BodyBuilder
            {
                TextBody =
                    $"{intro}\n\n{plainOtp}\n\n" +
                    $"This code expires in {_opt.OtpExpiryMinutes} minutes.\n\n" +
                    (forSignIn
                        ? "If you did not try to sign in, change your password and contact support."
                        : "If you did not request this, you can ignore this email."),
                HtmlBody =
                    $"<p>{System.Net.WebUtility.HtmlEncode(intro)}</p>" +
                    $"<p style=\"font-size:1.5rem;font-weight:700;letter-spacing:0.2em;\">{System.Net.WebUtility.HtmlEncode(plainOtp)}</p>" +
                    $"<p>This code expires in <strong>{_opt.OtpExpiryMinutes}</strong> minutes.</p>" +
                    (forSignIn
                        ? "<p>If you did not try to sign in, change your password and contact support.</p>"
                        : "<p>If you did not request this, you can ignore this email.</p>"),
            };
            message.Body = body.ToMessageBody();

            using var client = new SmtpClient();
            client.Timeout = (int)TimeSpan.FromSeconds(30).TotalMilliseconds;

            await client.ConnectAsync(_opt.SmtpHost, _opt.SmtpPort, SecureSocketOptions.StartTls, cancellationToken)
                .ConfigureAwait(false);
            try
            {
                await client.AuthenticateAsync(_opt.SmtpUser.Trim(), _opt.SmtpPassword.Replace(" ", "").Trim(), cancellationToken)
                    .ConfigureAwait(false);
                await client.SendAsync(message, cancellationToken).ConfigureAwait(false);
            }
            finally
            {
                if (client.IsConnected)
                    await client.DisconnectAsync(true, cancellationToken).ConfigureAwait(false);
            }

            _logger.LogInformation("Two-factor email OTP sent to {Email} (forSignIn={ForSignIn})", toEmail, forSignIn);
        }
    }
}
