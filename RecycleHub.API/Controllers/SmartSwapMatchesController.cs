using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.SmartSwapMatchDtos;
using RecycleHub.API.Services.Interfaces;
using System.Security.Claims;

namespace RecycleHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class SmartSwapMatchesController : ControllerBase
    {
        private readonly ISmartSwapMatchService _service;
        public SmartSwapMatchesController(ISmartSwapMatchService service) => _service = service;

        [HttpGet("my")]
        public async Task<IActionResult> GetMine([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var role   = User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("Role");
            if (role == "Buyer")  return Ok(await _service.GetMatchesForBuyerAsync(userId, page, pageSize));
            if (role == "Seller") return Ok(await _service.GetMatchesForSellerAsync(userId, page, pageSize));
            return Forbid();
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var m = await _service.GetMatchByIdAsync(id);
            if (m == null) return NotFound(ApiResponse<SmartSwapMatchResponseDto>.NotFound());
            return Ok(ApiResponse<SmartSwapMatchResponseDto>.Ok(m));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSmartSwapMatchDto dto)
        {
            var (ok, msg, data) = await _service.CreateMatchAsync(dto);
            if (!ok) return BadRequest(ApiResponse<SmartSwapMatchResponseDto>.Fail(msg));
            return CreatedAtAction(nameof(GetById), new { id = data!.MatchId }, ApiResponse<SmartSwapMatchResponseDto>.Created(data, msg));
        }

        [HttpPost("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateMatchStatusDto dto)
        {
            var (ok, msg) = await _service.UpdateMatchStatusAsync(id, dto);
            if (!ok) return NotFound(ApiResponse<string>.NotFound(msg));
            return Ok(ApiResponse<string>.Ok($"{dto.MatchStatus}", msg));
        }

        [HttpPost("generate/material/{materialId:int}")]
        public async Task<IActionResult> GenerateForMaterial(int materialId)
        {
            var matches = await _service.GenerateMatchesForMaterialAsync(materialId);
            return Ok(ApiResponse<List<SmartSwapMatchResponseDto>>.Ok(matches, $"{matches.Count} match(es) generated."));
        }
    }
}
