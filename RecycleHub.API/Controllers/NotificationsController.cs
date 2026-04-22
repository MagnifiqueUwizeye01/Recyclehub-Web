using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.NotificationDtos;
using RecycleHub.API.Services.Interfaces;
using System.Security.Claims;

namespace RecycleHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _service;
        public NotificationsController(INotificationService service) => _service = service;

        // GET api/notifications
        [HttpGet]
        public async Task<IActionResult> GetMine([FromQuery] bool unreadOnly = false)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var list   = await _service.GetUserNotificationsAsync(userId, unreadOnly);
            return Ok(ApiResponse<List<NotificationResponseDto>>.Ok(list));
        }

        // GET api/notifications/unread-count
        [HttpGet("unread-count")]
        public async Task<IActionResult> UnreadCount()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var count  = await _service.GetUnreadCountAsync(userId);
            return Ok(ApiResponse<int>.Ok(count));
        }

        // POST api/notifications/5/read
        [HttpPost("{id:int}/read")]
        public async Task<IActionResult> MarkRead(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (success, message) = await _service.MarkAsReadAsync(id, userId);
            if (!success) return NotFound(ApiResponse<string>.NotFound(message));
            return Ok(ApiResponse<string>.Ok("Read", message));
        }

        // POST api/notifications/read-all
        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllRead()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (_, message) = await _service.MarkAllAsReadAsync(userId);
            return Ok(ApiResponse<string>.Ok("All read", message));
        }

        // DELETE api/notifications/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (success, message) = await _service.DeleteNotificationAsync(id, userId);
            if (!success) return NotFound(ApiResponse<string>.NotFound(message));
            return Ok(ApiResponse<string>.Ok("Deleted", message));
        }
    }
}
