using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.Models
{
    public class Report
    {
        public int ReportId { get; set; }
        public int ReporterUserId { get; set; }
        public int ReportedUserId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Details { get; set; }
        public string Context { get; set; } = string.Empty;
        public ReportStatus Status { get; set; } = ReportStatus.Pending;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewedAt { get; set; }

        public User ReporterUser { get; set; } = null!;
        public User ReportedUser { get; set; } = null!;
    }
}
