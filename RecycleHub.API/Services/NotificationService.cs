using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Data;
using RecycleHub.API.DTOs.NotificationDtos;
using RecycleHub.API.Hubs;
using RecycleHub.API.Models;
using RecycleHub.API.Services.Interfaces;

namespace RecycleHub.API.Services
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _db;
        private readonly IHubContext<NotificationHub> _hub;

        public NotificationService(AppDbContext db, IHubContext<NotificationHub> hub) { _db = db; _hub = hub; }

        public async Task<List<NotificationResponseDto>> GetUserNotificationsAsync(int userId, bool unreadOnly = false)
        {
            var q = _db.Notifications.Where(n => n.UserId == userId);
            if (unreadOnly) q = q.Where(n => !n.IsRead);
            return await q.OrderByDescending(n => n.CreatedAt).Select(n => ToDto(n)).ToListAsync();
        }

        public async Task<int> GetUnreadCountAsync(int userId)
            => await _db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);

        public async Task<(bool Success, string Message)> MarkAsReadAsync(int notificationId, int userId)
        {
            var n = await _db.Notifications.FirstOrDefaultAsync(x => x.NotificationId == notificationId && x.UserId == userId);
            if (n == null) return (false, "Notification not found.");
            n.IsRead = true; n.ReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, "Marked as read.");
        }

        public async Task<(bool Success, string Message)> MarkAllAsReadAsync(int userId)
        {
            await _db.Notifications.Where(n => n.UserId == userId && !n.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true).SetProperty(n => n.ReadAt, DateTime.UtcNow));
            return (true, "All notifications marked as read.");
        }

        public async Task<(bool Success, string Message)> DeleteNotificationAsync(int notificationId, int userId)
        {
            var n = await _db.Notifications.FirstOrDefaultAsync(x => x.NotificationId == notificationId && x.UserId == userId);
            if (n == null) return (false, "Notification not found.");
            _db.Notifications.Remove(n);
            await _db.SaveChangesAsync();
            return (true, "Notification deleted.");
        }

        public async Task SendNotificationAsync(int userId, string title, string message, NotificationType type,
            int? referenceId = null, string? referenceTable = null, string? actionUrl = null)
        {
            var notif = new Notification
            {
                UserId = userId, Title = title, Message = message, NotificationType = type,
                ReferenceId = referenceId, ReferenceTable = referenceTable, ActionUrl = actionUrl,
                CreatedAt = DateTime.UtcNow
            };
            _db.Notifications.Add(notif);
            await _db.SaveChangesAsync();
            // Push real-time via SignalR
            await _hub.Clients.User(userId.ToString()).SendAsync("ReceiveNotification", ToDto(notif));
        }

        private static NotificationResponseDto ToDto(Notification n) => new()
        {
            NotificationId   = n.NotificationId,
            UserId           = n.UserId,
            Title            = n.Title,
            Message          = n.Message,
            NotificationType = n.NotificationType,
            IsRead           = n.IsRead,
            ReadAt           = n.ReadAt,
            ActionUrl        = n.ActionUrl,
            ReferenceId      = n.ReferenceId,
            ReferenceTable   = n.ReferenceTable,
            CreatedAt        = n.CreatedAt
        };
    }
}
