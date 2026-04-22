using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecycleHub.API.Common.Constants;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.OrderDtos;
using RecycleHub.API.Services.Interfaces;
using System.Linq;
using System.Security.Claims;

namespace RecycleHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _service;
        public OrdersController(IOrderService service) => _service = service;

        /// <summary>JWT may expose role as ClaimTypes.Role, short "role", or namespaced claim.</summary>
        private static string? ResolveRole(ClaimsPrincipal user)
        {
            string? r = user.FindFirstValue(ClaimTypes.Role);
            if (!string.IsNullOrEmpty(r)) return r;
            r = user.FindFirstValue("role");
            if (!string.IsNullOrEmpty(r)) return r;
            return user.Claims.FirstOrDefault(c =>
                c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(c.Type, "role", StringComparison.OrdinalIgnoreCase))?.Value;
        }

        [HttpGet]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> GetAll([FromQuery] OrderFilterDto filter)
            => Ok(await _service.GetAllOrdersAsync(filter));

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var o = await _service.GetOrderByIdAsync(id);
            if (o == null) return NotFound(ApiResponse<OrderResponseDto>.NotFound());
            var role = ResolveRole(User);
            var isAdmin = string.Equals(role, AppConstants.RoleAdmin, StringComparison.OrdinalIgnoreCase);
            if (!isAdmin && o.BuyerUserId != userId && o.SellerUserId != userId)
                return Forbid();
            var isSeller = string.Equals(role, AppConstants.RoleSeller, StringComparison.OrdinalIgnoreCase);
            if (isSeller && o.Status == OrderStatus.AwaitingPayment)
                return NotFound(ApiResponse<OrderResponseDto>.NotFound("This order is not visible until the buyer completes payment."));
            return Ok(ApiResponse<OrderResponseDto>.Ok(o));
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMy([FromQuery] OrderFilterDto filter)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var role = ResolveRole(User);
            if (string.IsNullOrEmpty(role))
                return Unauthorized(ApiResponse<string>.Fail("Invalid session: missing role. Please sign in again."));
            if (string.Equals(role, AppConstants.RoleBuyer, StringComparison.OrdinalIgnoreCase))
                return Ok(await _service.GetOrdersByBuyerAsync(userId, filter));
            if (string.Equals(role, AppConstants.RoleSeller, StringComparison.OrdinalIgnoreCase))
                return Ok(await _service.GetOrdersBySellerAsync(userId, filter));
            if (string.Equals(role, AppConstants.RoleAdmin, StringComparison.OrdinalIgnoreCase))
                return Ok(await _service.GetAllOrdersAsync(filter));
            return Forbid();
        }

        [HttpPost]
        [Authorize(Policy = AppConstants.PolicyBuyerOnly)]
        public async Task<IActionResult> PlaceOrder([FromBody] CreateOrderDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (ok, msg, data) = await _service.PlaceOrderAsync(userId, dto);
            if (!ok) return BadRequest(ApiResponse<OrderResponseDto>.Fail(msg));
            return CreatedAtAction(nameof(GetById), new { id = data!.OrderId }, ApiResponse<OrderResponseDto>.Created(data, msg));
        }

        [HttpPost("{id:int}/confirm")]
        [Authorize(Policy = AppConstants.PolicySellerOnly)]
        public async Task<IActionResult> Confirm(int id)
        {
            var (ok, msg) = await _service.ConfirmOrderAsync(id);
            if (!ok) return BadRequest(ApiResponse<string>.Fail(msg));
            return Ok(ApiResponse<string>.Ok("Confirmed", msg));
        }

        [HttpPost("{id:int}/reject")]
        [Authorize(Policy = AppConstants.PolicySellerOnly)]
        public async Task<IActionResult> Reject(int id, [FromBody] RejectOrderDto? dto)
        {
            var sellerUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (ok, msg) = await _service.RejectOrderAsync(id, sellerUserId, dto?.Note);
            if (!ok) return BadRequest(ApiResponse<string>.Fail(msg));
            return Ok(ApiResponse<string>.Ok("Rejected", msg));
        }

        [HttpPost("{id:int}/ship")]
        [Authorize(Policy = AppConstants.PolicySellerOnly)]
        public async Task<IActionResult> Ship(int id)
        {
            var (ok, msg) = await _service.ShipOrderAsync(id);
            if (!ok) return BadRequest(ApiResponse<string>.Fail(msg));
            return Ok(ApiResponse<string>.Ok("Shipped", msg));
        }

        [HttpPost("{id:int}/deliver")]
        [Authorize(Policy = AppConstants.PolicySellerOnly)]
        public async Task<IActionResult> Deliver(int id)
        {
            var (ok, msg) = await _service.DeliverOrderAsync(id);
            if (!ok) return BadRequest(ApiResponse<string>.Fail(msg));
            return Ok(ApiResponse<string>.Ok("Delivered", msg));
        }

        [HttpPost("{id:int}/cancel")]
        public async Task<IActionResult> Cancel(int id, [FromBody] CancelOrderDto? dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var reason = dto?.Reason ?? string.Empty;
            var (ok, msg) = await _service.CancelOrderAsync(id, reason, userId);
            if (!ok) return BadRequest(ApiResponse<string>.Fail(msg));
            return Ok(ApiResponse<string>.Ok("Cancelled", msg));
        }
    }

    public class CancelOrderDto { public string Reason { get; set; } = string.Empty; }

    public class RejectOrderDto { public string? Note { get; set; } }
}
