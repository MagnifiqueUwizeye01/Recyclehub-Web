using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.AIAnalysisResultDtos;
using RecycleHub.API.Services.Interfaces;

namespace RecycleHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class AIAnalysisResultsController : ControllerBase
    {
        private readonly IAIAnalysisResultService _service;
        public AIAnalysisResultsController(IAIAnalysisResultService service) => _service = service;

        // GET api/aianalysisresults/material/5
        [HttpGet("material/{materialId:int}")]
        public async Task<IActionResult> GetByMaterial(int materialId)
        {
            var results = await _service.GetResultsByMaterialAsync(materialId);
            return Ok(ApiResponse<List<AIAnalysisResultResponseDto>>.Ok(results));
        }

        // GET api/aianalysisresults/5
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetResultByIdAsync(id);
            if (result == null) return NotFound(ApiResponse<AIAnalysisResultResponseDto>.NotFound());
            return Ok(ApiResponse<AIAnalysisResultResponseDto>.Ok(result));
        }

        // POST api/aianalysisresults
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAIAnalysisResultDto dto)
        {
            var (success, message, data) = await _service.CreateResultAsync(dto);
            if (!success) return BadRequest(ApiResponse<AIAnalysisResultResponseDto>.Fail(message));
            return CreatedAtAction(nameof(GetById), new { id = data!.AnalysisId }, ApiResponse<AIAnalysisResultResponseDto>.Created(data!, message));
        }

        // DELETE api/aianalysisresults/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var (success, message) = await _service.DeleteResultAsync(id);
            if (!success) return NotFound(ApiResponse<string>.NotFound(message));
            return Ok(ApiResponse<string>.Ok("Deleted", message));
        }
    }
}
