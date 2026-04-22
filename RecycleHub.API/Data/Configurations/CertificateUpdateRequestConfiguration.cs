using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Models;

namespace RecycleHub.API.Data.Configurations
{
    public class CertificateUpdateRequestConfiguration : IEntityTypeConfiguration<CertificateUpdateRequest>
    {
        public void Configure(EntityTypeBuilder<CertificateUpdateRequest> e)
        {
            e.ToTable("CertificateUpdateRequests");
            e.HasKey(x => x.RequestId);
            e.Property(x => x.RequestId).UseIdentityColumn();
            e.Property(x => x.CertificateName).HasMaxLength(255).IsRequired();
            e.Property(x => x.IssuingAuthority).HasMaxLength(255).IsRequired();
            e.Property(x => x.DocumentUrl).HasMaxLength(500).IsRequired();
            e.Property(x => x.Notes).HasMaxLength(2000);
            e.Property(x => x.Status).HasMaxLength(20).IsRequired()
                .HasConversion<string>().HasDefaultValue(CertificateRequestStatus.Pending);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            e.HasOne(x => x.SellerUser).WithMany()
                .HasForeignKey(x => x.SellerUserId).OnDelete(DeleteBehavior.Cascade);
        }
    }
}
