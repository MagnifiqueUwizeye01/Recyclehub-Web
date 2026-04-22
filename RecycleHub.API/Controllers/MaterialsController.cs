using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecycleHub.API.Common.Constants;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.MaterialDtos;
using RecycleHub.API.Services.Interfaces;
using System.Security.Claims;

namespace RecycleHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class MaterialsController : ControllerBase
    {
        private readonly IMaterialService _service;
        public MaterialsController(IMaterialService service) => _service = service;

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll([FromQuery] MaterialFilterDto filter)
            => Ok(await _service.GetAllMaterialsAsync(filter));

        [HttpGet("seller/{sellerUserId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBySeller(int sellerUserId, [FromQuery] MaterialFilterDto filter)
        {
            filter.SellerUserId = sellerUserId;
            if (!filter.Status.HasValue)
                filter.Status = MaterialStatus.Available;
            return Ok(await _service.GetAllMaterialsAsync(filter));
        }

        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(int id)
        {
            var m = await _service.GetMaterialByIdAsync(id);
            if (m == null) return NotFound(ApiResponse<MaterialResponseDto>.NotFound());
            await _service.IncrementViewCountAsync(id);
            return Ok(ApiResponse<MaterialResponseDto>.Ok(m));
        }

        [HttpGet("my")]
        [Authorize(Policy = AppConstants.PolicySellerOnly)]
        public async Task<IActionResult> GetMine([FromQuery] MaterialFilterDto filter)
        {
            var userId  = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Ok(await _service.GetMaterialsBySellerAsync(userId, filter));
        }

        [HttpPost]
        [Authorize(Policy = AppConstants.PolicySellerOnly)]
        public async Task<IActionResult> Create([FromBody] CreateMaterialDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (ok, msg, data) = await _service.CreateMaterialAsync(userId, dto);
            if (!ok) return BadRequest(ApiResponse<MaterialResponseDto>.Fail(msg));
            return CreatedAtAction(nameof(GetById), new { id = data!.MaterialId }, ApiResponse<MaterialResponseDto>.Created(data, msg));
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = AppConstants.PolicySellerOnly)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateMaterialDto dto)
        {
            var (ok, msg, data) = await _service.UpdateMaterialAsync(id, dto);
            if (!ok) return BadRequest(ApiResponse<MaterialResponseDto>.Fail(msg));
            return Ok(ApiResponse<MaterialResponseDto>.Ok(data!, msg));
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = AppConstants.PolicySellerOnly)]
        public async Task<IActionResult> Delete(int id)
        {
            var (ok, msg) = await _service.DeleteMaterialAsync(id);
            if (!ok) return NotFound(ApiResponse<string>.NotFound(msg));
            return Ok(ApiResponse<string>.Ok("Deleted", msg));
        }

        [HttpPost("{id:int}/submit")]
        [Authorize(Policy = AppConstants.PolicySellerOnly)]
        public async Task<IActionResult> Submit(int id)
        {
            var (ok, msg) = await _service.SubmitForVerificationAsync(id);
            if (!ok) return BadRequest(ApiResponse<string>.Fail(msg));
            return Ok(ApiResponse<string>.Ok("Submitted", msg));
        }

        [HttpGet("pending")]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> GetPending([FromQuery] MaterialFilterDto filter)
        {
            filter.Status = MaterialStatus.Pending;
            return Ok(await _service.GetAllMaterialsAsync(filter));
        }

        [HttpPost("{id:int}/verify")]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> Verify(int id, [FromBody] VerifyMaterialDto dto)
        {
            var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (ok, msg) = await _service.VerifyMaterialAsync(id, dto, adminId);
            if (!ok) return NotFound(ApiResponse<string>.NotFound(msg));
            return Ok(ApiResponse<string>.Ok("Updated", msg));
        }
    }
}
