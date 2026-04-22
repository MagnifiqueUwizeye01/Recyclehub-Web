using Microsoft.IdentityModel.Tokens;
using RecycleHub.API.Common.Settings;
using RecycleHub.API.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace RecycleHub.API.Helpers
{
    public class JwtTokenGenerator
    {
        private readonly JwtSettings _settings;
        public JwtTokenGenerator(JwtSettings settings) => _settings = settings;

        public (string AccessToken, string RefreshToken, DateTime Expiry) GenerateTokens(User user)
        {
            var expiry = DateTime.UtcNow.AddMinutes(_settings.TokenExpiryMinutes);
            var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
            var creds  = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new(ClaimTypes.Email,          user.Email),
                new(ClaimTypes.Name,           user.Username),
                new(ClaimTypes.GivenName,      user.FirstName),
                new(ClaimTypes.Surname,        user.LastName),
                new(ClaimTypes.Role,           user.Role.ToString()),
                new("Username",                user.Username),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer:             _settings.Issuer,
                audience:           _settings.Audience,
                claims:             claims,
                expires:            expiry,
                signingCredentials: creds);

            return (new JwtSecurityTokenHandler().WriteToken(token), GenerateRefreshToken(), expiry);
        }

        private static string GenerateRefreshToken()
        {
            var bytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes);
        }
    }
}
