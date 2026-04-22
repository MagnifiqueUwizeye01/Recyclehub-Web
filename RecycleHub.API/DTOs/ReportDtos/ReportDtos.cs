using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.DTOs.ReportDtos
{
    public class CreateReportDto
    {
        public int ReportedUserId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Details { get; set; }
        public string Context { get; set; } = string.Empty;
    }

    public class ReportResponseDto
    {
        public int ReportId { get; set; }
        public int ReporterUserId { get; set; }
        public string ReporterName { get; set; } = string.Empty;
        public int ReportedUserId { get; set; }
        public string ReportedUserName { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string? Details { get; set; }
        public string Context { get; set; } = string.Empty;
        public ReportStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ReportFilterDto
    {
        public ReportStatus? Status { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }

    public class UpdateReportStatusDto
    {
        public ReportStatus Status { get; set; }
    }
}
