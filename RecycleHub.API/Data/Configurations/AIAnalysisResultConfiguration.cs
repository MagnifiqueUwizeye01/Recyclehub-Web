using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RecycleHub.API.Models;

namespace RecycleHub.API.Data.Configurations
{
    public class AIAnalysisResultConfiguration : IEntityTypeConfiguration<AIAnalysisResult>
    {
        public void Configure(EntityTypeBuilder<AIAnalysisResult> e)
        {
            e.ToTable("AIAnalysisResults");
            e.HasKey(a => a.AnalysisId);
            e.Property(a => a.AnalysisId).UseIdentityColumn();
            e.Property(a => a.DetectedType).HasMaxLength(100);
            e.Property(a => a.PredictedGrade).HasMaxLength(50);
            e.Property(a => a.ConfidenceScore).HasColumnType("decimal(5,2)");
            e.Property(a => a.RecyclabilityScore).HasColumnType("decimal(5,2)");
            e.Property(a => a.SuggestedPrice).HasColumnType("decimal(18,2)");
            e.Property(a => a.Notes).HasMaxLength(2000);
            e.Property(a => a.RawAIResponse).HasColumnType("nvarchar(max)");
            e.Property(a => a.AnalyzedAt).HasDefaultValueSql("GETUTCDATE()");

            e.HasOne(a => a.RequestedByUser).WithMany()
                .HasForeignKey(a => a.RequestedByUserId).OnDelete(DeleteBehavior.NoAction);
        }
    }
}
