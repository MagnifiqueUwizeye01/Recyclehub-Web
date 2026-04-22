using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RecycleHub.API.Models;

namespace RecycleHub.API.Data.Configurations
{
    public class SellerCertificateConfiguration : IEntityTypeConfiguration<SellerCertificate>
    {
        public void Configure(EntityTypeBuilder<SellerCertificate> e)
        {
            e.ToTable("SellerCertificates");
            e.HasKey(x => x.SellerCertificateId);
            e.Property(x => x.SellerCertificateId).UseIdentityColumn();
            e.Property(x => x.CertificateName).HasMaxLength(255).IsRequired();
            e.Property(x => x.IssuingAuthority).HasMaxLength(255).IsRequired();
            e.Property(x => x.DocumentUrl).HasMaxLength(500).IsRequired();
            e.Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            e.HasOne(x => x.SellerUser).WithMany()
                .HasForeignKey(x => x.SellerUserId).OnDelete(DeleteBehavior.Cascade);
        }
    }
}
