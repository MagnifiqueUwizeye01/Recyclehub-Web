using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using RecycleHub.API.Common.Constants;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.MessageDtos;
using RecycleHub.API.Helpers;
using RecycleHub.API.Services.Interfaces;
using System.Security.Claims;

namespace RecycleHub.API.Controllers
{
    /// <summary>
    /// Direct messaging between buyers and sellers.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class MessagesController : ControllerBase
    {
        private readonly IMessageService _service;
        private readonly IWebHostEnvironment _env;

        public MessagesController(IMessageService service, IWebHostEnvironment env)
        {
            _service = service;
            _env = env;
        }

        /// <summary>Upload an image for a chat message (stored under wwwroot/uploads/messages/).</summary>
        [HttpPost("upload-image")]
        [RequestFormLimits(MultipartBodyLengthLimit = 10_000_000)]
        [RequestSizeLimit(10_000_000)]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        public async Task<IActionResult> UploadChatImage(IFormFile? file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(ApiResponse<string>.Fail("No file uploaded.", 400));

            var webRoot = _env.WebRootPath;
            if (string.IsNullOrEmpty(webRoot))
                webRoot = Path.Combine(_env.ContentRootPath, "wwwroot");

            var (ok, url, err) = await FileHelper.SaveImageAsync(file, webRoot, "messages");
            if (!ok || url == null)
                return BadRequest(ApiResponse<string>.Fail(err ?? "Upload failed.", 400));

            return Ok(ApiResponse<string>.Ok(url, "Uploaded."));
        }

        // GET api/messages/conversations
        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var list   = await _service.GetConversationsAsync(userId);
            return Ok(ApiResponse<List<ConversationDto>>.Ok(list));
        }

        // GET api/messages/recipients
        [HttpGet("recipients")]
        public async Task<IActionResult> GetRecipients([FromQuery] string? search = null)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var list = await _service.GetAllowedRecipientsAsync(userId, search);
            return Ok(ApiResponse<List<MessageRecipientDto>>.Ok(list));
        }

        // GET api/messages/conversation/5
        [HttpGet("conversation/{otherUserId:int}")]
        public async Task<IActionResult> GetConversation(int otherUserId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var msgs   = await _service.GetConversationMessagesAsync(userId, otherUserId, page, pageSize);
            return Ok(ApiResponse<List<MessageResponseDto>>.Ok(msgs));
        }

        // GET api/messages/thread?otherUserId=5&materialId=10
        // Compatibility endpoint used by legacy frontend route shape.
        [HttpGet("thread")]
        public async Task<IActionResult> GetThread([FromQuery] int otherUserId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var msgs = await _service.GetConversationMessagesAsync(userId, otherUserId, page, pageSize);
            return Ok(ApiResponse<List<MessageResponseDto>>.Ok(msgs));
        }

        // GET api/messages/admin/thread?userIdA=2&userIdB=5
        [HttpGet("admin/thread")]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> GetThreadForAdmin([FromQuery] int userIdA, [FromQuery] int userIdB, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var msgs = await _service.GetThreadMessagesForAdminAsync(userIdA, userIdB, page, pageSize);
            return Ok(ApiResponse<List<MessageResponseDto>>.Ok(msgs));
        }

        // POST api/messages/send
        [HttpPost("send")]
        public async Task<IActionResult> Send([FromBody] SendMessageDto dto)
        {
            var senderId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (success, message, data) = await _service.SendMessageAsync(senderId, dto);
            if (!success) return BadRequest(ApiResponse<MessageResponseDto>.Fail(message));
            return Ok(ApiResponse<MessageResponseDto>.Ok(data!, message));
        }

        // POST api/messages
        // Compatibility endpoint used by legacy frontend route shape.
        [HttpPost]
        public Task<IActionResult> SendCompat([FromBody] SendMessageDto dto) => Send(dto);

        // POST api/messages/announcement
        [HttpPost("announcement")]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> SendAnnouncement([FromBody] AnnouncementDto dto)
        {
            var senderId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (success, message, delivered) = await _service.SendAnnouncementAsync(senderId, dto.MessageText);
            if (!success) return BadRequest(ApiResponse<int>.Fail(message));
            return Ok(ApiResponse<int>.Ok(delivered, message));
        }

        // POST api/messages/5/read
        [HttpPost("{id:int}/read")]
        public async Task<IActionResult> MarkRead(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (success, message) = await _service.MarkAsReadAsync(id, userId);
            if (!success) return NotFound(ApiResponse<string>.NotFound(message));
            return Ok(ApiResponse<string>.Ok("Read", message));
        }

        // PUT api/messages/5/read
        // Compatibility endpoint used by legacy frontend route shape.
        [HttpPut("{id:int}/read")]
        public Task<IActionResult> MarkReadCompat(int id) => MarkRead(id);

        // POST api/messages/conversation/5/read-all
        [HttpPost("conversation/{otherUserId:int}/read-all")]
        public async Task<IActionResult> MarkConversationRead(int otherUserId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (success, message) = await _service.MarkConversationAsReadAsync(userId, otherUserId);
            return Ok(ApiResponse<string>.Ok("All read", message));
        }

        // GET api/messages/unread-count
        [HttpGet("unread-count")]
        public async Task<IActionResult> UnreadCount()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var count  = await _service.GetUnreadCountAsync(userId);
            return Ok(ApiResponse<int>.Ok(count));
        }
    }
}
