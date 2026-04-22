using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.DTOs.NotificationDtos
{
    public class CreateNotificationDto
    {
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public NotificationType NotificationType { get; set; }
        public int? ReferenceId { get; set; }
        public string? ReferenceTable { get; set; }
        public string? ActionUrl { get; set; }
    }

    public class NotificationResponseDto
    {
        public int NotificationId { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public NotificationType NotificationType { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public string? ActionUrl { get; set; }
        public int? ReferenceId { get; set; }
        public string? ReferenceTable { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
