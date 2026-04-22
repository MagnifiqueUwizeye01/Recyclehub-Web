using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecycleHub.API.Common.Constants;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.PaymentDtos;
using RecycleHub.API.Services.Interfaces;
using System.Security.Claims;

namespace RecycleHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _service;
        public PaymentsController(IPaymentService service) => _service = service;

        [HttpGet]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int? pageNumber = null, [FromQuery] int pageSize = 30)
        {
            var p = pageNumber ?? page;
            return Ok(await _service.GetAllPaymentsAsync(p, pageSize));
        }

        [HttpGet("order/{orderId:int}")]
        [Authorize]
        public async Task<IActionResult> GetByOrder(int orderId)
        {
            var p = await _service.GetPaymentByOrderIdAsync(orderId);
            if (p == null)
                return Ok(ApiResponse<PaymentResponseDto>.Ok(null!, "No payment record yet."));
            return Ok(ApiResponse<PaymentResponseDto>.Ok(p));
        }

        [HttpGet("{id:int}")]
        [Authorize]
        public async Task<IActionResult> GetById(int id)
        {
            var p = await _service.GetPaymentByIdAsync(id);
            if (p == null) return NotFound(ApiResponse<PaymentResponseDto>.NotFound());
            return Ok(ApiResponse<PaymentResponseDto>.Ok(p));
        }

        [HttpPost("initiate")]
        [Authorize]
        public async Task<IActionResult> Initiate([FromBody] CreatePaymentDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (ok, msg, data) = await _service.InitiatePaymentAsync(userId, dto);
            if (!ok) return BadRequest(ApiResponse<PaymentResponseDto>.Fail(msg));
            return Ok(ApiResponse<PaymentResponseDto>.Ok(data!, msg));
        }

        [HttpPost("callback")]
        [AllowAnonymous]
        public async Task<IActionResult> Callback([FromBody] PaymentCallbackDto dto)
        {
            var (ok, msg) = await _service.HandleCallbackAsync(dto);
            if (!ok) return BadRequest(new { success = false, message = msg });
            return Ok(new { success = true, message = msg });
        }

        /// <summary>pawaPay asynchronous deposit callback — configure this URL in the pawaPay Dashboard.</summary>
        [HttpPost("webhooks/pawapay")]
        [AllowAnonymous]
        public async Task<IActionResult> PawaPayWebhook([FromBody] JsonDocument doc)
        {
            var (ok, msg) = await _service.HandlePawaPayWebhookAsync(doc);
            if (!ok) return BadRequest(new { success = false, message = msg });
            return Ok(new { success = true, message = msg });
        }

        [HttpGet("{id:int}/status")]
        [Authorize]
        public async Task<IActionResult> CheckStatus(int id)
        {
            var (ok, msg) = await _service.CheckPaymentStatusAsync(id);
            if (!ok) return NotFound(ApiResponse<string>.NotFound(msg));
            return Ok(ApiResponse<string>.Ok(msg));
        }
    }
}
