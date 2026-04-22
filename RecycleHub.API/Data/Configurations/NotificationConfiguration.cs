using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RecycleHub.API.Models;

namespace RecycleHub.API.Data.Configurations
{
    public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
    {
        public void Configure(EntityTypeBuilder<Notification> e)
        {
            e.ToTable("Notifications");
            e.HasKey(n => n.NotificationId);
            e.Property(n => n.NotificationId).UseIdentityColumn();
            e.Property(n => n.Title).HasMaxLength(255).IsRequired();
            e.Property(n => n.Message).HasMaxLength(1000).IsRequired();
            e.Property(n => n.NotificationType).HasMaxLength(20).IsRequired().HasConversion<string>();
            e.Property(n => n.ReferenceTable).HasMaxLength(50);
            e.Property(n => n.ActionUrl).HasMaxLength(500);
            e.Property(n => n.IsRead).HasDefaultValue(false);
            e.Property(n => n.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            e.HasOne(n => n.User).WithMany()
                .HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.Cascade);
        }
    }
}
