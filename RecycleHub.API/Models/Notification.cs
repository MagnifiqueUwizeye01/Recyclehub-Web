using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.Models
{
    /// <summary>Maps to dbo.Notifications — ReferenceId/ReferenceTable pattern.</summary>
    public class Notification
    {
        public int NotificationId { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public NotificationType NotificationType { get; set; }
        public int? ReferenceId { get; set; }
        public string? ReferenceTable { get; set; }
        public string? ActionUrl { get; set; }
        public bool IsRead { get; set; } = false;
        public DateTime? ReadAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // ── Navigation ────────────────────────────────────────────────────────
        public User User { get; set; } = null!;
    }
}
