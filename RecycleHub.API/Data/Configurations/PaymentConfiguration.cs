using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Models;

namespace RecycleHub.API.Data.Configurations
{
    public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
    {
        public void Configure(EntityTypeBuilder<Payment> e)
        {
            e.ToTable("Payments");
            e.HasKey(p => p.PaymentId);
            e.Property(p => p.PaymentId).UseIdentityColumn();
            e.Property(p => p.Amount).HasColumnType("decimal(18,2)").IsRequired();
            e.Property(p => p.PaymentMethod).HasMaxLength(20).HasDefaultValue("MobileMoney");
            e.Property(p => p.PhoneNumber).HasMaxLength(20).IsRequired();
            e.Property(p => p.Currency).HasMaxLength(10).HasDefaultValue("RWF");
            e.Property(p => p.ExternalReference).HasMaxLength(255);
            e.Property(p => p.MoMoReferenceId).HasMaxLength(255);
            e.Property(p => p.FinancialTransactionId).HasMaxLength(255);
            e.Property(p => p.PaymentStatus).HasMaxLength(15).IsRequired()
                .HasConversion<string>().HasDefaultValue(PaymentStatus.Pending);
            e.Property(p => p.RequestMessage).HasMaxLength(500);
            e.Property(p => p.FailureReason).HasMaxLength(500);
            e.Property(p => p.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            e.HasOne(p => p.BuyerUser).WithMany()
                .HasForeignKey(p => p.BuyerUserId).OnDelete(DeleteBehavior.NoAction);
        }
    }
}
