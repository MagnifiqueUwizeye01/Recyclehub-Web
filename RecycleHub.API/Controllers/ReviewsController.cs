using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecycleHub.API.Common.Constants;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.ReviewDtos;
using RecycleHub.API.Services.Interfaces;
using System.Security.Claims;

namespace RecycleHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _service;
        public ReviewsController(IReviewService service) => _service = service;

        [HttpGet]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> GetAll([FromQuery] ReviewFilterDto filter)
            => Ok(await _service.GetAllReviewsAsync(filter));

        [HttpGet("seller/{sellerUserId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBySeller(int sellerUserId, [FromQuery] ReviewFilterDto filter)
        {
            filter.SellerUserId = sellerUserId;
            return Ok(await _service.GetReviewsBySellerAsync(sellerUserId, filter));
        }

        [HttpGet("buyer/{buyerUserId:int}")]
        public async Task<IActionResult> GetByBuyer(int buyerUserId, [FromQuery] ReviewFilterDto filter)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            if (userId != buyerUserId && !User.IsInRole(AppConstants.RoleAdmin))
                return Forbid();
            filter.BuyerUserId = buyerUserId;
            return Ok(await _service.GetReviewsByBuyerAsync(buyerUserId, filter));
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var r = await _service.GetReviewByIdAsync(id);
            if (r == null) return NotFound(ApiResponse<ReviewResponseDto>.NotFound());
            return Ok(ApiResponse<ReviewResponseDto>.Ok(r));
        }

        [HttpPost]
        [Authorize(Policy = AppConstants.PolicyBuyerOnly)]
        public async Task<IActionResult> Create([FromBody] CreateReviewDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (ok, msg, data) = await _service.CreateReviewAsync(userId, dto);
            if (!ok) return BadRequest(ApiResponse<ReviewResponseDto>.Fail(msg));
            return CreatedAtAction(nameof(GetById), new { id = data!.ReviewId }, ApiResponse<ReviewResponseDto>.Created(data, msg));
        }

        [HttpPost("{id:int}/moderate")]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> Moderate(int id, [FromBody] ModerateReviewDto dto)
        {
            var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (ok, msg) = await _service.ModerateReviewAsync(id, dto, adminId);
            if (!ok) return NotFound(ApiResponse<string>.NotFound(msg));
            return Ok(ApiResponse<string>.Ok("Updated", msg));
        }

        [HttpPut("{id:int}/visibility")]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> SetVisibility(int id, [FromBody] ModerateReviewDto dto)
        {
            var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (ok, msg) = await _service.ModerateReviewAsync(id, dto, adminId);
            if (!ok) return NotFound(ApiResponse<string>.NotFound(msg));
            return Ok(ApiResponse<string>.Ok("Updated", msg));
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> Delete(int id)
        {
            var (ok, msg) = await _service.DeleteReviewAsync(id);
            if (!ok) return NotFound(ApiResponse<string>.NotFound(msg));
            return Ok(ApiResponse<string>.Ok("Deleted", msg));
        }
    }
}
