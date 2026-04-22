using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Models;

namespace RecycleHub.API.Data.Configurations
{
    public class SmartSwapMatchConfiguration : IEntityTypeConfiguration<SmartSwapMatch>
    {
        public void Configure(EntityTypeBuilder<SmartSwapMatch> e)
        {
            e.ToTable("SmartSwapMatches");
            e.HasKey(m => m.MatchId);
            e.Property(m => m.MatchId).UseIdentityColumn();
            e.Property(m => m.MatchScore).HasColumnType("decimal(5,2)").IsRequired();
            e.Property(m => m.SuggestedReason).HasMaxLength(1000);
            e.Property(m => m.MatchStatus).HasMaxLength(15).IsRequired()
                .HasConversion<string>().HasDefaultValue(MatchStatus.Suggested);
            e.Property(m => m.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            e.HasOne(m => m.Material).WithMany()
                .HasForeignKey(m => m.MaterialId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(m => m.SuggestedBuyerUser).WithMany()
                .HasForeignKey(m => m.SuggestedBuyerUserId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(m => m.SuggestedSellerUser).WithMany()
                .HasForeignKey(m => m.SuggestedSellerUserId).OnDelete(DeleteBehavior.NoAction);
        }
    }
}
