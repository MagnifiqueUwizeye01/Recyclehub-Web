using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecycleHub.API.Common.Constants;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.CertificateDtos;
using RecycleHub.API.DTOs.SellerProfileDtos;
using RecycleHub.API.Helpers;
using RecycleHub.API.Services.Interfaces;
using System.Security.Claims;

namespace RecycleHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class SellerProfilesController : ControllerBase
    {
        private readonly ISellerProfileService _service;
        private readonly ICertificateRequestService _certificateRequests;
        private readonly IWebHostEnvironment _env;

        public SellerProfilesController(
            ISellerProfileService service,
            ICertificateRequestService certificateRequests,
            IWebHostEnvironment env)
        {
            _service = service;
            _certificateRequests = certificateRequests;
            _env = env;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] SellerProfileFilterDto filter)
            => Ok(await _service.GetAllSellerProfilesAsync(filter));

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var p = await _service.GetSellerProfileByIdAsync(id);
            if (p == null) return NotFound(ApiResponse<SellerProfileResponseDto>.NotFound());
            return Ok(ApiResponse<SellerProfileResponseDto>.Ok(p));
        }

        [HttpGet("public/{userId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublic(int userId)
        {
            var p = await _service.GetPublicSellerProfileAsync(userId);
            if (p == null) return NotFound(ApiResponse<object>.NotFound("Seller not found."));
            return Ok(ApiResponse<object>.Ok(p));
        }

        [HttpGet("me")]
        [Authorize(Policy = AppConstants.PolicySellerOnly)]
        public async Task<IActionResult> GetMine()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var p = await _service.GetSellerProfileByUserIdAsync(userId);
            if (p == null) return NotFound(ApiResponse<SellerProfileResponseDto>.NotFound("No seller profile found."));
            return Ok(ApiResponse<SellerProfileResponseDto>.Ok(p));
        }

        [HttpPost]
        [Authorize(Policy = AppConstants.PolicySellerOnly)]
        public async Task<IActionResult> Create([FromBody] CreateSellerProfileDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (ok, msg, data) = await _service.CreateSellerProfileAsync(userId, dto);
            if (!ok) return BadRequest(ApiResponse<SellerProfileResponseDto>.Fail(msg));
            return CreatedAtAction(nameof(GetById), new { id = data!.SellerProfileId }, ApiResponse<SellerProfileResponseDto>.Created(data, msg));
        }

        [HttpPut("me")]
        [Authorize(Policy = AppConstants.PolicySellerOnly)]
        public async Task<IActionResult> Update([FromBody] UpdateSellerProfileDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (ok, msg, data) = await _service.UpdateSellerProfileAsync(userId, dto);
            if (!ok) return BadRequest(ApiResponse<SellerProfileResponseDto>.Fail(msg));
            return Ok(ApiResponse<SellerProfileResponseDto>.Ok(data!, msg));
        }

        [HttpPost("{userId:int}/verify")]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> Verify(int userId, [FromBody] VerifySellerProfileDto dto)
        {
            var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (ok, msg) = await _service.VerifySellerProfileAsync(userId, dto, adminId);
            if (!ok) return NotFound(ApiResponse<string>.NotFound(msg));
            return Ok(ApiResponse<string>.Ok($"{dto.VerificationStatus}", msg));
        }

        [HttpPost("{userId:int}/certificate-request")]
        [Authorize(Policy = AppConstants.PolicySellerOnly)]
        public async Task<IActionResult> SubmitCertificateRequest(
            int userId,
            [FromForm] string certificateName,
            [FromForm] string issuingAuthority,
            [FromForm] DateTime issueDate,
            [FromForm] DateTime? expiryDate,
            [FromForm] string? notes,
            IFormFile? certificateFile)
        {
            var authId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            if (authId != userId) return Forbid();

            if (certificateFile == null || certificateFile.Length == 0)
                return BadRequest(ApiResponse<object>.Fail("Certificate file is required."));
            if (string.IsNullOrWhiteSpace(certificateName) || string.IsNullOrWhiteSpace(issuingAuthority))
                return BadRequest(ApiResponse<object>.Fail("Certificate name and issuing authority are required."));

            var (okFile, url, err) = await FileHelper.SaveCertificateDocumentAsync(certificateFile, _env.WebRootPath, "certificates");
            if (!okFile || url == null) return BadRequest(ApiResponse<object>.Fail(err ?? "Upload failed."));

            var (ok, msg, data) = await _certificateRequests.SubmitRequestAsync(
                userId, certificateName, issuingAuthority, issueDate, expiryDate, url, notes);
            if (!ok) return BadRequest(ApiResponse<object>.Fail(msg));
            return StatusCode(201, ApiResponse<object>.Created(data!, msg));
        }

        [HttpPut("{userId:int}/certificate-request/{requestId:int}/approve")]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> ApproveCertificateRequest(int userId, int requestId)
        {
            var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (ok, msg) = await _certificateRequests.ApproveAsync(userId, requestId, adminId);
            if (!ok) return BadRequest(ApiResponse<string>.Fail(msg));
            return Ok(ApiResponse<string>.Ok("Approved", msg));
        }

        [HttpPut("{userId:int}/certificate-request/{requestId:int}/reject")]
        [Authorize(Policy = AppConstants.PolicyAdminOnly)]
        public async Task<IActionResult> RejectCertificateRequest(int userId, int requestId, [FromBody] CertificateRejectDto? dto)
        {
            var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (ok, msg) = await _certificateRequests.RejectAsync(userId, requestId, adminId, dto?.Message);
            if (!ok) return BadRequest(ApiResponse<string>.Fail(msg));
            return Ok(ApiResponse<string>.Ok("Rejected", msg));
        }
    }
}
