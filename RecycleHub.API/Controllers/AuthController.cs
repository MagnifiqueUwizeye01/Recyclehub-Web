using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.Auth;
using RecycleHub.API.Services.Interfaces;
using System.Security.Claims;

namespace RecycleHub.API.Controllers
{
    /// <summary>
    /// Handles user authentication: login, registration, token refresh, logout, and password management.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService) => _authService = authService;

        // POST api/auth/register
        [HttpPost("register")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), 400)]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(kv => kv.Value?.Errors.Count > 0)
                    .SelectMany(kv => kv.Value!.Errors.Select(e => string.IsNullOrEmpty(e.ErrorMessage) ? kv.Key : $"{kv.Key}: {e.ErrorMessage}"))
                    .ToList();
                return BadRequest(ApiResponse<AuthResponseDto>.Fail("Validation failed", 400, errors));
            }

            var (success, message, data) = await _authService.RegisterAsync(dto);
            if (!success) return BadRequest(ApiResponse<AuthResponseDto>.Fail(message));
            return StatusCode(StatusCodes.Status201Created, ApiResponse<AuthResponseDto>.Created(data!, message));
        }

        // POST api/auth/login
        [HttpPost("login")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), 401)]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<AuthResponseDto>.Fail("Invalid credentials format", 400));

            var (success, message, data) = await _authService.LoginAsync(dto);
            if (!success) return Unauthorized(ApiResponse<AuthResponseDto>.Fail(message, 401));
            return Ok(ApiResponse<AuthResponseDto>.Ok(data!, message));
        }

        // POST api/auth/login/2fa — complete login after email OTP (challenge from login response).
        [HttpPost("login/2fa")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), 401)]
        public async Task<IActionResult> CompleteTwoFactorLogin([FromBody] CompleteTwoFactorLoginDto dto, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<AuthResponseDto>.Fail("Invalid request.", 400));

            var (success, message, data) = await _authService.CompleteTwoFactorLoginAsync(dto, cancellationToken);
            if (!success) return Unauthorized(ApiResponse<AuthResponseDto>.Fail(message, 401));
            return Ok(ApiResponse<AuthResponseDto>.Ok(data!, message));
        }

        // POST api/auth/2fa/setup — send 6-digit code to the user’s email to enable 2FA.
        [HttpPost("2fa/setup")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<object>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> BeginTwoFactorSetup(CancellationToken cancellationToken)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (success, message) = await _authService.BeginTwoFactorSetupAsync(userId, cancellationToken);
            if (!success) return BadRequest(ApiResponse<object>.Fail(message));
            return Ok(new ApiResponse<object> { Success = true, StatusCode = 200, Message = message });
        }

        // POST api/auth/2fa/confirm — confirm enrollment with the 6-digit email code.
        [HttpPost("2fa/confirm")]
        [Authorize]
        public async Task<IActionResult> ConfirmTwoFactorSetup([FromBody] TwoFactorConfirmDto dto, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<object>.Fail("Invalid request.", 400));

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (success, message) = await _authService.ConfirmTwoFactorSetupAsync(userId, dto.Code, cancellationToken);
            if (!success) return BadRequest(ApiResponse<object>.Fail(message));
            return Ok(new ApiResponse<object> { Success = true, StatusCode = 200, Message = message });
        }

        // POST api/auth/2fa/disable — turn off 2FA (password required).
        [HttpPost("2fa/disable")]
        [Authorize]
        public async Task<IActionResult> DisableTwoFactor([FromBody] TwoFactorDisableDto dto, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<object>.Fail("Invalid request.", 400));

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (success, message) = await _authService.DisableTwoFactorAsync(userId, dto.Password, cancellationToken);
            if (!success) return BadRequest(ApiResponse<object>.Fail(message));
            return Ok(new ApiResponse<object> { Success = true, StatusCode = 200, Message = message });
        }

        // POST api/auth/2fa/cancel — discard pending email setup.
        [HttpPost("2fa/cancel")]
        [Authorize]
        public async Task<IActionResult> CancelTwoFactorSetup(CancellationToken cancellationToken)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (success, message) = await _authService.CancelTwoFactorSetupAsync(userId, cancellationToken);
            if (!success) return BadRequest(ApiResponse<object>.Fail(message));
            return Ok(new ApiResponse<object> { Success = true, StatusCode = 200, Message = message });
        }

        // POST api/auth/refresh
        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto dto)
        {
            var (success, message, data) = await _authService.RefreshTokenAsync(dto.RefreshToken);
            if (!success) return Unauthorized(ApiResponse<AuthResponseDto>.Fail(message, 401));
            return Ok(ApiResponse<AuthResponseDto>.Ok(data!, message));
        }

        // POST api/auth/logout
        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (success, message) = await _authService.RevokeTokenAsync(userId);
            return Ok(ApiResponse<string>.Ok("Logged out", message));
        }

        // POST api/auth/forgot-password — sends 6-digit OTP via email when account exists (Gmail SMTP).
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<object>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto dto, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<object>.Fail("Invalid email.", 400));

            var (success, message) = await _authService.RequestPasswordResetOtpAsync(dto.Email, cancellationToken);
            if (!success) return BadRequest(ApiResponse<object>.Fail(message));
            return Ok(new ApiResponse<object> { Success = true, StatusCode = 200, Message = message });
        }

        // POST api/auth/reset-password — email + 6-digit OTP + new password
        [HttpPost("reset-password")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<object>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto dto, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(kv => kv.Value?.Errors.Count > 0)
                    .SelectMany(kv => kv.Value!.Errors.Select(e => string.IsNullOrEmpty(e.ErrorMessage) ? kv.Key : e.ErrorMessage))
                    .ToList();
                var msg = errors.FirstOrDefault() ?? "Invalid request.";
                return BadRequest(ApiResponse<object>.Fail(msg, 400));
            }

            var (success, message) = await _authService.ResetPasswordWithOtpAsync(dto.Email, dto.Otp, dto.NewPassword, cancellationToken);
            if (!success) return BadRequest(ApiResponse<object>.Fail(message));
            return Ok(new ApiResponse<object> { Success = true, StatusCode = 200, Message = message });
        }

        // POST api/auth/change-password
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (success, message) = await _authService.ChangePasswordAsync(userId, dto.CurrentPassword, dto.NewPassword);
            if (!success) return BadRequest(ApiResponse<string>.Fail(message));
            return Ok(ApiResponse<string>.Ok("Password changed", message));
        }

        // GET api/auth/me
        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<CurrentUserDto>), 200)]
        public async Task<IActionResult> Me()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await _authService.GetCurrentUserAsync(userId);
            if (user == null) return NotFound(ApiResponse<CurrentUserDto>.Fail("User not found.", 404));
            return Ok(ApiResponse<CurrentUserDto>.Ok(user));
        }
    }
}
