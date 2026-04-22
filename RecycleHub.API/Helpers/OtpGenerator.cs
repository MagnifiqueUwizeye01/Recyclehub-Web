using System.Security.Cryptography;

namespace RecycleHub.API.Helpers
{
    public static class OtpGenerator
    {
        /// <summary>Uniform 6-digit numeric OTP (000000–999999).</summary>
        public static string GenerateSixDigit()
        {
            Span<byte> buf = stackalloc byte[4];
            RandomNumberGenerator.Fill(buf);
            var n = (int)(BitConverter.ToUInt32(buf) % 1_000_000u);
            return n.ToString("D6", System.Globalization.CultureInfo.InvariantCulture);
        }
    }
}
