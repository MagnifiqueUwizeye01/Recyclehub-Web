using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecycleHub.API.Common.Constants;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.UserDtos;
using Microsoft.AspNetCore.Hosting;
using RecycleHub.API.Helpers;
using RecycleHub.API.Services.Interfaces;
using System.Security.Claims;

namespace RecycleHub.API.Controllers
{
    /// <summary>
    /// Manages platform users. Admin-only for most actions.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IWebHostEnvironment _env;

        public UsersController(IUserService userService, IWebHostEnvironment env)
        {
            _userService = userService;
            _env = env;
        }

        private int RequesterUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        private bool IsAdmin()
        {
            var role = User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("role") ?? "";
            return string.Equals(role, AppConstants.RoleAdmin, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>Upload profile photo — stored under wwwroot/uploads/profiles/. Caller may only upload for self (or admin for any user).</summary>
        [HttpPost("{id:int}/profile-image")]
        [RequestFormLimits(MultipartBodyLengthLimit = 12_000_000)]
        [RequestSizeLimit(12_000_000)]
        public async Task<IActionResult> UploadProfileImage(int id, IFormFile? file)
        {
            var requesterId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var role = User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("role") ?? "";
            var isAdmin = string.Equals(role, AppConstants.RoleAdmin, StringComparison.OrdinalIgnoreCase);
            if (requesterId != id && !isAdmin)
                return Forbid();

            if (file == null || file.Length == 0)
                return BadRequest(ApiResponse<UserResponseDto>.Fail("No file uploaded."));

            var webRoot = _env.WebRootPath;
            if (string.IsNullOrEmpty(webRoot))
                webRoot = Path.Combine(_env.ContentRootPath, "wwwroot");

            var existing = await _userService.GetUserByIdAsync(id);
            if (existing == null)
                return NotFound(ApiResponse<UserResponseDto>.NotFound("User not found."));

            if (!string.IsNullOrEmpty(existing.ProfileImageUrl))
                FileHelper.DeleteFile(existing.ProfileImageUrl, webRoot);

            var (ok, url, err) = await FileHelper.SaveImageAsync(file, webRoot, "profiles");
            if (!ok || url == null)
                return BadRequest(ApiResponse<UserResponseDto>.Fail(err ?? "Could not save image."));

            var (success, message, data) = await _userService.UpdateUserAsync(id, new UpdateUserDto { ProfileImageUrl = url });
            if (!success) return BadRequest(ApiResponse<UserResponseDto>.Fail(message));
            return Ok(ApiResponse<UserResponseDto>.Ok(data!, message));
        }

        // GET api/users
        [HttpGet]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> GetAll([FromQuery] UserFilterDto filter)
        {
            var result = await _userService.GetAllUsersAsync(filter);
            return Ok(result);
        }

        // GET api/users/5
        [HttpGet("{id:int}")]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> GetById(int id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null) return NotFound(ApiResponse<UserResponseDto>.NotFound($"User {id} not found."));
            return Ok(ApiResponse<UserResponseDto>.Ok(user));
        }

        // POST api/users — admin creates an account
        [HttpPost]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> Create([FromBody] CreateUserByAdminDto dto)
        {
            var (success, message, data) = await _userService.CreateUserByAdminAsync(dto);
            if (!success) return BadRequest(ApiResponse<UserResponseDto>.Fail(message));
            return CreatedAtAction(nameof(GetById), new { id = data!.UserId }, ApiResponse<UserResponseDto>.Ok(data, message));
        }

        // PUT api/users/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto)
        {
            var requesterId = RequesterUserId;
            var isAdmin = IsAdmin();
            if (requesterId != id && !isAdmin)
                return Forbid();

            if (!isAdmin)
            {
                dto.Email = null;
                dto.Username = null;
                dto.Role = null;
                dto.Status = null;
            }
            else if (id == requesterId && dto.Status == UserStatus.Suspended)
                return BadRequest(ApiResponse<UserResponseDto>.Fail("You cannot suspend your own account."));

            var (success, message, data) = await _userService.UpdateUserAsync(id, dto);
            if (!success) return BadRequest(ApiResponse<UserResponseDto>.Fail(message));
            return Ok(ApiResponse<UserResponseDto>.Ok(data!, message));
        }

        // DELETE api/users/5
        [HttpDelete("{id:int}")]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> Delete(int id)
        {
            if (id == RequesterUserId)
                return BadRequest(ApiResponse<string>.Fail("You cannot delete your own account."));
            var (success, message) = await _userService.DeleteUserAsync(id);
            if (!success)
            {
                if (message.Contains("not allowed", StringComparison.OrdinalIgnoreCase))
                    return BadRequest(ApiResponse<string>.Fail(message));
                return NotFound(ApiResponse<string>.NotFound(message));
            }
            return Ok(ApiResponse<string>.Ok("Deleted", message));
        }

        // POST api/users/5/suspend
        [HttpPost("{id:int}/suspend")]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> Suspend(int id)
        {
            if (id == RequesterUserId)
                return BadRequest(ApiResponse<string>.Fail("You cannot suspend your own account."));
            var (success, message) = await _userService.SuspendUserAsync(id);
            if (!success) return NotFound(ApiResponse<string>.NotFound(message));
            return Ok(ApiResponse<string>.Ok("Suspended", message));
        }

        // POST api/users/5/activate
        [HttpPost("{id:int}/activate")]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> Activate(int id)
        {
            var (success, message) = await _userService.ActivateUserAsync(id);
            if (!success) return NotFound(ApiResponse<string>.NotFound(message));
            return Ok(ApiResponse<string>.Ok("Activated", message));
        }

        // PUT api/users/5/status
        [HttpPut("{id:int}/status")]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> SetStatus(int id, [FromBody] UpdateUserStatusDto dto)
        {
            if (id == RequesterUserId && dto.Status == UserStatus.Suspended)
                return BadRequest(ApiResponse<UserResponseDto>.Fail("You cannot suspend your own account."));
            var (success, message, data) = await _userService.UpdateUserAsync(id, new UpdateUserDto { Status = dto.Status });
            if (!success) return BadRequest(ApiResponse<UserResponseDto>.Fail(message));
            return Ok(ApiResponse<UserResponseDto>.Ok(data!, message));
        }
    }
}
