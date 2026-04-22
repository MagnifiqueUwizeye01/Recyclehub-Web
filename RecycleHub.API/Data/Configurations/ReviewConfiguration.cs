using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Models;

namespace RecycleHub.API.Data.Configurations
{
    public class ReviewConfiguration : IEntityTypeConfiguration<Review>
    {
        public void Configure(EntityTypeBuilder<Review> e)
        {
            e.ToTable("Reviews");
            e.HasKey(r => r.ReviewId);
            e.Property(r => r.ReviewId).UseIdentityColumn();
            e.Property(r => r.Rating).IsRequired();
            e.Property(r => r.Comment).HasMaxLength(2000);
            e.Property(r => r.Status).HasMaxLength(10).IsRequired()
                .HasConversion<string>().HasDefaultValue(ReviewStatus.Visible);
            e.Property(r => r.HiddenReason).HasMaxLength(500);
            e.Property(r => r.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            e.HasOne(r => r.BuyerUser).WithMany()
                .HasForeignKey(r => r.BuyerUserId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(r => r.SellerUser).WithMany()
                .HasForeignKey(r => r.SellerUserId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(r => r.HiddenByAdmin).WithMany()
                .HasForeignKey(r => r.HiddenByAdminId).OnDelete(DeleteBehavior.NoAction);
        }
    }
}
