using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Models;

namespace RecycleHub.API.Data.Configurations
{
    public class MessageConfiguration : IEntityTypeConfiguration<Message>
    {
        public void Configure(EntityTypeBuilder<Message> e)
        {
            e.ToTable("Messages");
            e.HasKey(m => m.MessageId);
            e.Property(m => m.MessageId).UseIdentityColumn();
            e.Property(m => m.MessageType).HasMaxLength(20).IsRequired()
                .HasConversion<string>().HasDefaultValue(MessageType.General);
            e.Property(m => m.MessageText).HasMaxLength(4000).IsRequired();
            e.Property(m => m.AttachmentUrl).HasMaxLength(500);
            e.Property(m => m.IsRead).HasDefaultValue(false);
            e.Property(m => m.SentAt).HasDefaultValueSql("GETUTCDATE()");

            e.HasOne(m => m.SenderUser).WithMany()
                .HasForeignKey(m => m.SenderUserId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(m => m.ReceiverUser).WithMany()
                .HasForeignKey(m => m.ReceiverUserId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(m => m.Order).WithMany()
                .HasForeignKey(m => m.OrderId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(m => m.Material).WithMany()
                .HasForeignKey(m => m.MaterialId).OnDelete(DeleteBehavior.NoAction);
        }
    }
}
