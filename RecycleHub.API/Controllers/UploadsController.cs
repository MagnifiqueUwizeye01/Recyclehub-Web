using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.Helpers;

namespace RecycleHub.API.Controllers
{
    /// <summary>Anonymous uploads used during registration (seller license, etc.).</summary>
    [ApiController]
    [Route("api/uploads")]
    public class UploadsController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public UploadsController(IWebHostEnvironment env) => _env = env;

        /// <summary>Stores a seller license PDF/image under wwwroot/uploads/licenses/.</summary>
        [HttpPost("seller-license")]
        [AllowAnonymous]
        [RequestFormLimits(MultipartBodyLengthLimit = 16_000_000)]
        [RequestSizeLimit(16_000_000)]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        public async Task<IActionResult> UploadSellerLicense(IFormFile? file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(ApiResponse<string>.Fail("No file uploaded.", 400));

            var webRoot = _env.WebRootPath;
            if (string.IsNullOrEmpty(webRoot))
                webRoot = Path.Combine(_env.ContentRootPath, "wwwroot");

            var (ok, url, error) = await FileHelper.SaveCertificateDocumentAsync(file, webRoot, "licenses");
            if (!ok || url == null)
                return BadRequest(ApiResponse<string>.Fail(error ?? "Upload failed.", 400));

            return Ok(ApiResponse<string>.Ok(url, "Uploaded."));
        }
    }
}
