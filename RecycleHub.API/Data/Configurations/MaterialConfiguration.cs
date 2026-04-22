using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Models;

namespace RecycleHub.API.Data.Configurations
{
    public class MaterialConfiguration : IEntityTypeConfiguration<Material>
    {
        public void Configure(EntityTypeBuilder<Material> e)
        {
            e.ToTable("Materials");
            e.HasKey(m => m.MaterialId);
            e.Property(m => m.MaterialId).UseIdentityColumn();
            e.Property(m => m.Title).HasMaxLength(255).IsRequired();
            e.Property(m => m.Description).HasMaxLength(2000);
            e.Property(m => m.MaterialType).HasMaxLength(20).IsRequired().HasConversion<string>();
            e.Property(m => m.Quantity).HasColumnType("decimal(18,4)").IsRequired();
            e.Property(m => m.UnitPrice).HasColumnType("decimal(18,2)").IsRequired();
            e.Property(m => m.Unit).HasMaxLength(30).IsRequired();
            e.Property(m => m.MinOrderQty).HasColumnType("decimal(18,4)").HasDefaultValue(1m);
            e.Property(m => m.City).HasMaxLength(100).IsRequired();
            e.Property(m => m.Address).HasMaxLength(500).IsRequired();
            e.Property(m => m.Grade).HasMaxLength(50);
            e.Property(m => m.Status).HasMaxLength(15).IsRequired()
                .HasConversion<string>().HasDefaultValue(MaterialStatus.Available);
            e.Property(m => m.AdminNote).HasMaxLength(1000);
            e.Property(m => m.ViewCount).HasDefaultValue(0);
            e.Property(m => m.IsSmartSwap).HasDefaultValue(false);
            e.Property(m => m.SmartSwapDescription).HasMaxLength(2000);
            e.Property(m => m.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            e.HasOne(m => m.SellerUser).WithMany()
                .HasForeignKey(m => m.SellerUserId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(m => m.VerifiedByAdmin).WithMany()
                .HasForeignKey(m => m.VerifiedByAdminId).OnDelete(DeleteBehavior.NoAction);
            e.HasMany(m => m.Images).WithOne(i => i.Material)
                .HasForeignKey(i => i.MaterialId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(m => m.AIAnalysisResults).WithOne(a => a.Material)
                .HasForeignKey(a => a.MaterialId).OnDelete(DeleteBehavior.Cascade);
        }
    }
}
