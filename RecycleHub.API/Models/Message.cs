using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.Models
{
    /// <summary>Maps to dbo.Messages — MessageText, SenderUserId/ReceiverUserId FKs.</summary>
    public class Message
    {
        public int MessageId { get; set; }
        public int SenderUserId { get; set; }
        public int ReceiverUserId { get; set; }
        public int? OrderId { get; set; }
        public int? MaterialId { get; set; }
        public MessageType MessageType { get; set; } = MessageType.General;
        public string MessageText { get; set; } = string.Empty;
        public string? AttachmentUrl { get; set; }
        public bool IsRead { get; set; } = false;
        public DateTime? ReadAt { get; set; }
        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        // ── Navigation ────────────────────────────────────────────────────────
        public User SenderUser { get; set; } = null!;
        public User ReceiverUser { get; set; } = null!;
        public Order? Order { get; set; }
        public Material? Material { get; set; }
    }
}
