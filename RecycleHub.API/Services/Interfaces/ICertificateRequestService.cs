using RecycleHub.API.Common.Enums;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.CertificateDtos;

namespace RecycleHub.API.Services.Interfaces
{
    public interface ICertificateRequestService
    {
        Task<(bool Success, string Message, CertificateUpdateRequestResponseDto? Data)> SubmitRequestAsync(
            int sellerUserId, string certificateName, string issuingAuthority,
            DateTime issueDate, DateTime? expiryDate, string documentUrl, string? notes);

        Task<PagedResult<CertificateUpdateRequestResponseDto>> GetRequestsAsync(CertificateRequestStatus? status, int page, int pageSize);

        Task<(bool Success, string Message)> ApproveAsync(int sellerUserId, int requestId, int adminUserId);

        Task<(bool Success, string Message)> RejectAsync(int sellerUserId, int requestId, int adminUserId, string? adminNote);
    }
}
