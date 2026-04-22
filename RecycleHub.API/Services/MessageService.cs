using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Data;
using RecycleHub.API.DTOs.MessageDtos;
using RecycleHub.API.Hubs;
using RecycleHub.API.Models;
using RecycleHub.API.Services.Interfaces;

namespace RecycleHub.API.Services
{
    public class MessageService : IMessageService
    {
        private readonly AppDbContext _db;
        private readonly IHubContext<NotificationHub> _hub;
        private readonly INotificationService _notifications;

        public MessageService(AppDbContext db, IHubContext<NotificationHub> hub, INotificationService notifications)
        {
            _db = db;
            _hub = hub;
            _notifications = notifications;
        }

        public async Task<List<ConversationDto>> GetConversationsAsync(int userId)
        {
            var messages = await _db.Messages
                .Include(m => m.SenderUser).Include(m => m.ReceiverUser)
                .Where(m => m.SenderUserId == userId || m.ReceiverUserId == userId)
                .OrderByDescending(m => m.SentAt)
                .ToListAsync();

            return messages
                .GroupBy(m => m.SenderUserId == userId ? m.ReceiverUserId : m.SenderUserId)
                .Select(g =>
                {
                    var other = g.First().SenderUserId == userId ? g.First().ReceiverUser : g.First().SenderUser;
                    return new ConversationDto
                    {
                        OtherUserId   = other.UserId,
                        OtherUsername  = other.Username,
                        OtherFullName  = $"{other.FirstName} {other.LastName}",
                        OtherAvatarUrl = other.ProfileImageUrl,
                        OtherUserRole  = other.Role,
                        LastMessage    = g.First().MessageText,
                        LastMessageAt  = g.First().SentAt,
                        UnreadCount    = g.Count(m => m.ReceiverUserId == userId && !m.IsRead)
                    };
                })
                .OrderByDescending(c => c.LastMessageAt)
                .ToList();
        }

        public async Task<List<MessageRecipientDto>> GetAllowedRecipientsAsync(int userId, string? search = null)
        {
            var sender = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId);
            if (sender == null) return [];

            IQueryable<User> q = _db.Users.AsNoTracking().Where(u => u.UserId != userId && u.Status == UserStatus.Active);

            if (sender.Role == UserRole.Buyer)
                q = q.Where(u => u.Role == UserRole.Seller);
            else if (sender.Role == UserRole.Seller)
                q = q.Where(u => u.Role == UserRole.Buyer);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                q = q.Where(u =>
                    u.Username.ToLower().Contains(s) ||
                    u.Email.ToLower().Contains(s) ||
                    (u.FirstName + " " + u.LastName).ToLower().Contains(s));
            }

            return await q
                .OrderBy(u => u.FirstName).ThenBy(u => u.LastName)
                .Select(u => new MessageRecipientDto
                {
                    UserId = u.UserId,
                    Username = u.Username,
                    FullName = $"{u.FirstName} {u.LastName}",
                    Email = u.Email,
                    Role = u.Role,
                    ProfileImageUrl = u.ProfileImageUrl
                })
                .ToListAsync();
        }

        public async Task<List<MessageResponseDto>> GetConversationMessagesAsync(int userIdA, int userIdB, int page, int pageSize)
        {
            var rows = await _db.Messages
                .Include(m => m.SenderUser).Include(m => m.ReceiverUser)
                .Include(m => m.Material)!.ThenInclude(mat => mat!.Images)
                .Where(m => (m.SenderUserId == userIdA && m.ReceiverUserId == userIdB)
                         || (m.SenderUserId == userIdB && m.ReceiverUserId == userIdA))
                .OrderByDescending(m => m.SentAt)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .ToListAsync();
            return rows.Select(ToDto).ToList();
        }

        public async Task<List<MessageResponseDto>> GetThreadMessagesForAdminAsync(int userIdA, int userIdB, int page, int pageSize)
        {
            var existsA = await _db.Users.AsNoTracking().AnyAsync(u => u.UserId == userIdA);
            var existsB = await _db.Users.AsNoTracking().AnyAsync(u => u.UserId == userIdB);
            if (!existsA || !existsB) return [];

            var rows = await _db.Messages
                .Include(m => m.SenderUser).Include(m => m.ReceiverUser)
                .Include(m => m.Material)!.ThenInclude(mat => mat!.Images)
                .Where(m => (m.SenderUserId == userIdA && m.ReceiverUserId == userIdB)
                         || (m.SenderUserId == userIdB && m.ReceiverUserId == userIdA))
                .OrderByDescending(m => m.SentAt)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .ToListAsync();
            return rows.Select(ToDto).ToList();
        }

        public async Task<(bool Success, string Message, MessageResponseDto? Data)> SendMessageAsync(int senderUserId, SendMessageDto dto)
        {
            var sender = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == senderUserId);
            var receiver = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == dto.ReceiverUserId);
            if (sender == null || receiver == null)
                return (false, "Sender or receiver was not found.", null);

            if (dto.MessageType == MessageType.AdminNotice && sender.Role != UserRole.Admin)
                return (false, "Only administrators can send admin notices.", null);

            if (sender.Role != UserRole.Admin)
            {
                if (receiver.Role == UserRole.Admin)
                    return (false, "You cannot send messages to platform administrators.", null);
                var isBuyerToSeller = sender.Role == UserRole.Buyer && receiver.Role == UserRole.Seller;
                var isSellerToBuyer = sender.Role == UserRole.Seller && receiver.Role == UserRole.Buyer;
                if (!isBuyerToSeller && !isSellerToBuyer)
                    return (false, "Messaging is allowed only between buyers and sellers.", null);
            }

            var text = dto.MessageText?.Trim() ?? "";
            var hasAttachment = !string.IsNullOrWhiteSpace(dto.AttachmentUrl);
            var hasMaterial = dto.MaterialId.HasValue;
            if (text.Length == 0 && !hasAttachment && !hasMaterial)
                return (false, "Message cannot be empty.", null);
            if (text.Length == 0 && hasAttachment)
                text = "📷";

            var msg = new Message
            {
                SenderUserId   = senderUserId,
                ReceiverUserId = dto.ReceiverUserId,
                OrderId        = dto.OrderId,
                MaterialId     = dto.MaterialId,
                MessageType    = dto.MessageType,
                MessageText    = text,
                AttachmentUrl  = dto.AttachmentUrl,
                SentAt         = DateTime.UtcNow
            };
            _db.Messages.Add(msg);
            await _db.SaveChangesAsync();

            msg = await _db.Messages
                .Include(m => m.SenderUser).Include(m => m.ReceiverUser)
                .Include(m => m.Material)!.ThenInclude(mat => mat!.Images)
                .FirstAsync(m => m.MessageId == msg.MessageId);

            var response = ToDto(msg);
            await _hub.Clients.User(dto.ReceiverUserId.ToString()).SendAsync("ReceiveMessage", response);

            if (msg.MessageType == MessageType.AdminNotice)
            {
                await _notifications.SendNotificationAsync(
                    dto.ReceiverUserId,
                    "RecycleHub Admin",
                    (dto.MessageText ?? "").Length > 900 ? dto.MessageText![..900] + "…" : (dto.MessageText ?? ""),
                    NotificationType.AdminNotice,
                    msg.MessageId,
                    "Messages",
                    "/messages");
            }

            return (true, "Message sent.", response);
        }

        public async Task<(bool Success, string Message, int DeliveredCount)> SendAnnouncementAsync(int senderUserId, string messageText)
        {
            var sender = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == senderUserId);
            if (sender == null) return (false, "Sender was not found.", 0);
            if (sender.Role != UserRole.Admin) return (false, "Only admins can send announcements.", 0);
            if (string.IsNullOrWhiteSpace(messageText)) return (false, "Announcement message is required.", 0);

            var recipients = await _db.Users
                .AsNoTracking()
                .Where(u => u.UserId != senderUserId && u.Status == UserStatus.Active)
                .Select(u => u.UserId)
                .ToListAsync();

            if (recipients.Count == 0) return (true, "No active users to notify.", 0);

            var now = DateTime.UtcNow;
            var messages = recipients.Select(id => new Message
            {
                SenderUserId = senderUserId,
                ReceiverUserId = id,
                MessageType = MessageType.General,
                MessageText = messageText.Trim(),
                SentAt = now
            }).ToList();

            _db.Messages.AddRange(messages);
            await _db.SaveChangesAsync();

            return (true, "Announcement sent.", recipients.Count);
        }

        public async Task<(bool Success, string Message)> MarkAsReadAsync(int messageId, int receiverUserId)
        {
            var msg = await _db.Messages.FirstOrDefaultAsync(m => m.MessageId == messageId && m.ReceiverUserId == receiverUserId);
            if (msg == null) return (false, "Message not found.");
            msg.IsRead = true; msg.ReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, "Message marked as read.");
        }

        public async Task<(bool Success, string Message)> MarkConversationAsReadAsync(int userId, int otherUserId)
        {
            await _db.Messages
                .Where(m => m.SenderUserId == otherUserId && m.ReceiverUserId == userId && !m.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(m => m.IsRead, true).SetProperty(m => m.ReadAt, DateTime.UtcNow));
            return (true, "Conversation marked as read.");
        }

        public async Task<int> GetUnreadCountAsync(int userId)
            => await _db.Messages.CountAsync(m => m.ReceiverUserId == userId && !m.IsRead);

        private static MessageResponseDto ToDto(Message m)
        {
            string? matTitle = null, matImg = null, matUnit = null;
            decimal? matPrice = null;
            if (m.Material != null)
            {
                matTitle = m.Material.Title;
                matPrice = m.Material.UnitPrice;
                matUnit = m.Material.Unit;
                var img = m.Material.Images?
                    .OrderByDescending(i => i.IsPrimary)
                    .ThenBy(i => i.SortOrder)
                    .FirstOrDefault();
                matImg = img?.ImageUrl;
            }

            return new MessageResponseDto
            {
                MessageId      = m.MessageId,
                SenderUserId   = m.SenderUserId,
                SenderUsername = m.SenderUser?.Username ?? "",
                SenderFullName = $"{m.SenderUser?.FirstName} {m.SenderUser?.LastName}",
                SenderRole     = m.SenderUser?.Role ?? UserRole.Buyer,
                SenderAvatarUrl= m.SenderUser?.ProfileImageUrl,
                ReceiverUserId = m.ReceiverUserId,
                ReceiverUsername= m.ReceiverUser?.Username ?? "",
                MessageText    = m.MessageText,
                MessageType    = m.MessageType,
                IsRead         = m.IsRead,
                ReadAt         = m.ReadAt,
                AttachmentUrl  = m.AttachmentUrl,
                OrderId        = m.OrderId,
                MaterialId     = m.MaterialId,
                MaterialTitle  = matTitle,
                MaterialPreviewImageUrl = matImg,
                MaterialUnitPrice = matPrice,
                MaterialUnit   = matUnit,
                SentAt         = m.SentAt
            };
        }
    }
}
