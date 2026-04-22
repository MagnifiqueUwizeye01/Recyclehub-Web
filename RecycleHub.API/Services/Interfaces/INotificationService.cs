using RecycleHub.API.Common.Enums;
using RecycleHub.API.DTOs.NotificationDtos;

namespace RecycleHub.API.Services.Interfaces
{
    public interface INotificationService
    {
        Task<List<NotificationResponseDto>> GetUserNotificationsAsync(int userId, bool unreadOnly = false);
        Task<int> GetUnreadCountAsync(int userId);
        Task<(bool Success, string Message)> MarkAsReadAsync(int notificationId, int userId);
        Task<(bool Success, string Message)> MarkAllAsReadAsync(int userId);
        Task<(bool Success, string Message)> DeleteNotificationAsync(int notificationId, int userId);
        Task SendNotificationAsync(int userId, string title, string message, NotificationType type, int? referenceId = null, string? referenceTable = null, string? actionUrl = null);
    }
}
