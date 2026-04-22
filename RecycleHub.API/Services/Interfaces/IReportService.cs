using RecycleHub.API.Common.Enums;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.ReportDtos;

namespace RecycleHub.API.Services.Interfaces
{
    public interface IReportService
    {
        Task<(bool Success, string Message, ReportResponseDto? Data)> CreateReportAsync(int reporterUserId, CreateReportDto dto);
        Task<PagedResult<ReportResponseDto>> GetReportsAsync(ReportFilterDto filter);
        Task<ReportResponseDto?> GetByIdAsync(int reportId);
        Task<(bool Success, string Message)> UpdateStatusAsync(int reportId, ReportStatus status);
        Task<int> GetPendingCountAsync();
    }
}
