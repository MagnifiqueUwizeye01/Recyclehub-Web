using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RecycleHub.API.Models;

namespace RecycleHub.API.Data.Configurations
{
    public class BuyerProfileConfiguration : IEntityTypeConfiguration<BuyerProfile>
    {
        public void Configure(EntityTypeBuilder<BuyerProfile> e)
        {
            e.ToTable("BuyerProfiles");
            e.HasKey(b => b.BuyerProfileId);
            e.Property(b => b.BuyerProfileId).UseIdentityColumn();
            e.Property(b => b.CompanyName).HasMaxLength(255).IsRequired();
            e.Property(b => b.IndustryType).HasMaxLength(150).IsRequired();
            e.Property(b => b.City).HasMaxLength(100).IsRequired();
            e.Property(b => b.Address).HasMaxLength(500).IsRequired();
            e.Property(b => b.WebsiteUrl).HasMaxLength(500);
            e.Property(b => b.Description).HasMaxLength(1000);
            e.Property(b => b.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        }
    }
}
