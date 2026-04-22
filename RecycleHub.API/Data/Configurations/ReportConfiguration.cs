using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Models;

namespace RecycleHub.API.Data.Configurations
{
    public class ReportConfiguration : IEntityTypeConfiguration<Report>
    {
        public void Configure(EntityTypeBuilder<Report> e)
        {
            e.ToTable("Reports");
            e.HasKey(x => x.ReportId);
            e.Property(x => x.ReportId).UseIdentityColumn();
            e.Property(x => x.Reason).HasMaxLength(500).IsRequired();
            e.Property(x => x.Details).HasMaxLength(4000);
            e.Property(x => x.Context).HasMaxLength(50).IsRequired();
            e.Property(x => x.Status).HasMaxLength(20).IsRequired()
                .HasConversion<string>().HasDefaultValue(ReportStatus.Pending);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            e.HasOne(x => x.ReporterUser).WithMany()
                .HasForeignKey(x => x.ReporterUserId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(x => x.ReportedUser).WithMany()
                .HasForeignKey(x => x.ReportedUserId).OnDelete(DeleteBehavior.NoAction);
        }
    }
}
