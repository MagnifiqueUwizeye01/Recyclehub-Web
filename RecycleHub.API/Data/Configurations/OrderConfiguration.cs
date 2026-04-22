using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Models;

namespace RecycleHub.API.Data.Configurations
{
    public class OrderConfiguration : IEntityTypeConfiguration<Order>
    {
        public void Configure(EntityTypeBuilder<Order> e)
        {
            e.ToTable("Orders");
            e.HasKey(o => o.OrderId);
            e.Property(o => o.OrderId).UseIdentityColumn();
            e.Property(o => o.QuantityOrdered).HasColumnType("decimal(18,4)").IsRequired();
            e.Property(o => o.OfferedUnitPrice).HasColumnType("decimal(18,2)").IsRequired();
            e.Property(o => o.TotalAmount).HasColumnType("decimal(18,2)").IsRequired();
            e.Property(o => o.Currency).HasMaxLength(10).HasDefaultValue("RWF");
            e.Property(o => o.Status).HasMaxLength(24).IsRequired()
                .HasConversion<string>().HasDefaultValue(OrderStatus.Pending);
            e.Property(o => o.BuyerNote).HasMaxLength(1000);
            e.Property(o => o.SellerNote).HasMaxLength(1000);
            e.Property(o => o.ShippingAddress).HasMaxLength(500);
            e.Property(o => o.CancelReason).HasMaxLength(500);
            e.Property(o => o.OrderDate).HasDefaultValueSql("GETUTCDATE()");

            e.HasOne(o => o.BuyerUser).WithMany()
                .HasForeignKey(o => o.BuyerUserId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(o => o.SellerUser).WithMany()
                .HasForeignKey(o => o.SellerUserId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(o => o.Material).WithMany()
                .HasForeignKey(o => o.MaterialId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(o => o.Payment).WithOne(p => p.Order)
                .HasForeignKey<Payment>(p => p.OrderId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(o => o.Review).WithOne(r => r.Order)
                .HasForeignKey<Review>(r => r.OrderId).OnDelete(DeleteBehavior.NoAction);
        }
    }
}
