using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecycleHub.API.Common.Constants;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.BuyerProfileDtos;
using RecycleHub.API.Services.Interfaces;
using System.Security.Claims;

namespace RecycleHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class BuyerProfilesController : ControllerBase
    {
        private readonly IBuyerProfileService _service;
        public BuyerProfilesController(IBuyerProfileService service) => _service = service;

        [HttpGet]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> GetAll([FromQuery] BuyerProfileFilterDto filter)
            => Ok(await _service.GetAllBuyerProfilesAsync(filter));

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var p = await _service.GetBuyerProfileByIdAsync(id);
            if (p == null) return NotFound(ApiResponse<BuyerProfileResponseDto>.NotFound());
            return Ok(ApiResponse<BuyerProfileResponseDto>.Ok(p));
        }

        [HttpGet("me")]
        [Authorize(Policy = AppConstants.PolicyBuyerOnly)]
        public async Task<IActionResult> GetMine()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var p = await _service.GetBuyerProfileByUserIdAsync(userId);
            if (p == null) return NotFound(ApiResponse<BuyerProfileResponseDto>.NotFound("No buyer profile found."));
            return Ok(ApiResponse<BuyerProfileResponseDto>.Ok(p));
        }

        [HttpPost]
        [Authorize(Policy = AppConstants.PolicyBuyerOnly)]
        public async Task<IActionResult> Create([FromBody] CreateBuyerProfileDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (ok, msg, data) = await _service.CreateBuyerProfileAsync(userId, dto);
            if (!ok) return BadRequest(ApiResponse<BuyerProfileResponseDto>.Fail(msg));
            return CreatedAtAction(nameof(GetById), new { id = data!.BuyerProfileId }, ApiResponse<BuyerProfileResponseDto>.Created(data, msg));
        }

        [HttpPut("me")]
        [Authorize(Policy = AppConstants.PolicyBuyerOnly)]
        public async Task<IActionResult> Update([FromBody] UpdateBuyerProfileDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (ok, msg, data) = await _service.UpdateBuyerProfileAsync(userId, dto);
            if (!ok) return BadRequest(ApiResponse<BuyerProfileResponseDto>.Fail(msg));
            return Ok(ApiResponse<BuyerProfileResponseDto>.Ok(data!, msg));
        }
    }
}
