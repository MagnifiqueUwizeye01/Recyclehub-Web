using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.DTOs.MessageDtos
{
    public class SendMessageDto
    {
        public int ReceiverUserId { get; set; }
        public int? OrderId { get; set; }
        public int? MaterialId { get; set; }
        public MessageType MessageType { get; set; } = MessageType.General;
        public string MessageText { get; set; } = string.Empty;
        public string? AttachmentUrl { get; set; }
    }

    public class MessageResponseDto
    {
        public int MessageId { get; set; }
        public int SenderUserId { get; set; }
        public string SenderUsername { get; set; } = string.Empty;
        public string SenderFullName { get; set; } = string.Empty;
        public UserRole SenderRole { get; set; }
        public string? SenderAvatarUrl { get; set; }
        public int ReceiverUserId { get; set; }
        public string ReceiverUsername { get; set; } = string.Empty;
        public string MessageText { get; set; } = string.Empty;
        public MessageType MessageType { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public string? AttachmentUrl { get; set; }
        public int? OrderId { get; set; }
        public int? MaterialId { get; set; }

        /// <summary>Populated when <see cref="MaterialId"/> is set (for product preview in chat).</summary>
        public string? MaterialTitle { get; set; }

        public string? MaterialPreviewImageUrl { get; set; }
        public decimal? MaterialUnitPrice { get; set; }
        public string? MaterialUnit { get; set; }

        public DateTime SentAt { get; set; }
    }

    public class ConversationDto
    {
        public int OtherUserId { get; set; }
        public string OtherUsername { get; set; } = string.Empty;
        public string OtherFullName { get; set; } = string.Empty;
        public string? OtherAvatarUrl { get; set; }
        public UserRole OtherUserRole { get; set; }
        public string LastMessage { get; set; } = string.Empty;
        public DateTime LastMessageAt { get; set; }
        public int UnreadCount { get; set; }
    }

    public class MessageRecipientDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public string? ProfileImageUrl { get; set; }
    }

    public class AnnouncementDto
    {
        public string MessageText { get; set; } = string.Empty;
    }
}
