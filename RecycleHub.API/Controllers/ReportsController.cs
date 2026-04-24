using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecycleHub.API.Common.Constants;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.ReportDtos;
using RecycleHub.API.Services.Interfaces;
using System.Security.Claims;

namespace RecycleHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _service;
        public ReportsController(IReportService service) => _service = service;

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateReportDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (ok, msg, data) = await _service.CreateReportAsync(userId, dto);
            if (!ok) return BadRequest(ApiResponse<ReportResponseDto>.Fail(msg));
            return StatusCode(201, ApiResponse<ReportResponseDto>.Created(data!, msg));
        }

        [HttpGet]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> GetAll([FromQuery] ReportFilterDto filter)
            => Ok(await _service.GetReportsAsync(filter));

        [HttpGet("my")]
        public async Task<IActionResult> GetMine([FromQuery] ReportFilterDto filter)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Ok(await _service.GetMyReportsAsync(userId, filter));
        }

        [HttpGet("pending-count")]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> PendingCount()
        {
            var n = await _service.GetPendingCountAsync();
            return Ok(ApiResponse<int>.Ok(n));
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> GetById(int id)
        {
            var r = await _service.GetByIdAsync(id);
            if (r == null) return NotFound(ApiResponse<ReportResponseDto>.NotFound());
            return Ok(ApiResponse<ReportResponseDto>.Ok(r));
        }

        [HttpPut("{id:int}/status")]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> SetStatus(int id, [FromBody] UpdateReportStatusDto dto)
        {
            var (ok, msg) = await _service.UpdateStatusAsync(id, dto.Status);
            if (!ok) return NotFound(ApiResponse<string>.NotFound(msg));
            return Ok(ApiResponse<string>.Ok("Updated", msg));
        }
    }
}
