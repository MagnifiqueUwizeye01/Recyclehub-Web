using RecycleHub.API.DTOs.MessageDtos;

namespace RecycleHub.API.Services.Interfaces
{
    public interface IMessageService
    {
        Task<List<ConversationDto>> GetConversationsAsync(int userId);
        Task<List<MessageRecipientDto>> GetAllowedRecipientsAsync(int userId, string? search = null);
        Task<List<MessageResponseDto>> GetConversationMessagesAsync(int userIdA, int userIdB, int page, int pageSize);
        Task<List<MessageResponseDto>> GetThreadMessagesForAdminAsync(int userIdA, int userIdB, int page, int pageSize);
        Task<(bool Success, string Message, MessageResponseDto? Data)> SendMessageAsync(int senderUserId, SendMessageDto dto);
        Task<(bool Success, string Message, int DeliveredCount)> SendAnnouncementAsync(int senderUserId, string messageText);
        Task<(bool Success, string Message)> MarkAsReadAsync(int messageId, int receiverUserId);
        Task<(bool Success, string Message)> MarkConversationAsReadAsync(int userId, int otherUserId);
        Task<int> GetUnreadCountAsync(int userId);
    }
}
