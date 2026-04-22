using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RecycleHub.API.Common.Constants;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Services.Interfaces;

namespace RecycleHub.API.Controllers
{
    [ApiController]
    [Route("api/certificate-requests")]
    [Authorize(Policy = AppConstants.PolicyAdminOnly)]
    [Produces("application/json")]
    public class CertificateRequestsController : ControllerBase
    {
        private readonly ICertificateRequestService _service;
        public CertificateRequestsController(ICertificateRequestService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] CertificateRequestStatus? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
            => Ok(await _service.GetRequestsAsync(status, page, pageSize));
    }
}
