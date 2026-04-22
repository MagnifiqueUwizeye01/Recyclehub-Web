using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.MaterialImageDtos;
using RecycleHub.API.Services.Interfaces;

namespace RecycleHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class MaterialImagesController : ControllerBase
    {
        private readonly IMaterialImageService _service;
        private readonly IWebHostEnvironment _env;
        public MaterialImagesController(IMaterialImageService service, IWebHostEnvironment env) { _service = service; _env = env; }

        [HttpGet("material/{materialId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByMaterial(int materialId)
            => Ok(ApiResponse<List<MaterialImageResponseDto>>.Ok(await _service.GetImagesByMaterialAsync(materialId)));

        [HttpPost("upload/{materialId:int}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Upload(int materialId, IFormFile file, [FromQuery] bool isPrimary = false)
        {
            if (file == null || file.Length == 0) return BadRequest(ApiResponse<MaterialImageResponseDto>.Fail("No file provided."));
            var (ok, msg, data) = await _service.UploadImageAsync(materialId, file, _env.WebRootPath, isPrimary);
            if (!ok) return BadRequest(ApiResponse<MaterialImageResponseDto>.Fail(msg));
            return Ok(ApiResponse<MaterialImageResponseDto>.Created(data!, msg));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var (ok, msg) = await _service.DeleteImageAsync(id, _env.WebRootPath);
            if (!ok) return NotFound(ApiResponse<string>.NotFound(msg));
            return Ok(ApiResponse<string>.Ok("Deleted", msg));
        }

        [HttpPost("{id:int}/set-primary")]
        public async Task<IActionResult> SetPrimary(int id)
        {
            var (ok, msg) = await _service.SetCoverImageAsync(id);
            if (!ok) return NotFound(ApiResponse<string>.NotFound(msg));
            return Ok(ApiResponse<string>.Ok("Primary set", msg));
        }
    }
}
