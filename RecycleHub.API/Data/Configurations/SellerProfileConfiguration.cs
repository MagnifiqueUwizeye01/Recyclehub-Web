using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Models;

namespace RecycleHub.API.Data.Configurations
{
    public class SellerProfileConfiguration : IEntityTypeConfiguration<SellerProfile>
    {
        public void Configure(EntityTypeBuilder<SellerProfile> e)
        {
            e.ToTable("SellerProfiles");
            e.HasKey(s => s.SellerProfileId);
            e.Property(s => s.SellerProfileId).UseIdentityColumn();
            e.Property(s => s.CompanyName).HasMaxLength(255).IsRequired();
            e.Property(s => s.LicenseDocument).HasMaxLength(500).IsRequired();
            e.Property(s => s.VerificationStatus).HasMaxLength(15).IsRequired()
                .HasConversion<string>().HasDefaultValue(VerificationStatus.Pending);
            e.Property(s => s.VerificationNote).HasMaxLength(1000);
            e.Property(s => s.City).HasMaxLength(100).IsRequired();
            e.Property(s => s.Address).HasMaxLength(500).IsRequired();
            e.Property(s => s.WebsiteUrl).HasMaxLength(500);
            e.Property(s => s.Description).HasMaxLength(1000);
            e.Property(s => s.TotalSales).HasDefaultValue(0);
            e.Property(s => s.AverageRating).HasColumnType("decimal(3,2)").HasDefaultValue(0.00m);
            e.Property(s => s.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            e.HasOne(s => s.VerifiedByAdmin).WithMany()
                .HasForeignKey(s => s.VerifiedByAdminId).OnDelete(DeleteBehavior.NoAction);
            e.HasMany(s => s.Materials).WithOne()
                .HasForeignKey(m => m.SellerUserId).OnDelete(DeleteBehavior.NoAction);
        }
    }
}
