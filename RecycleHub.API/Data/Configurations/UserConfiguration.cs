using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Models;

namespace RecycleHub.API.Data.Configurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> e)
        {
            e.ToTable("Users");
            e.HasKey(u => u.UserId);
            e.Property(u => u.UserId).UseIdentityColumn();
            e.Property(u => u.Username).HasMaxLength(60).IsRequired();
            e.HasIndex(u => u.Username).IsUnique();
            e.Property(u => u.FirstName).HasMaxLength(100).IsRequired();
            e.Property(u => u.LastName).HasMaxLength(100).IsRequired();
            e.Property(u => u.Gender).HasMaxLength(10).IsRequired().HasConversion<string>();
            e.Property(u => u.Email).HasMaxLength(255).IsRequired();
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.PasswordHash).HasMaxLength(512).IsRequired();
            e.Property(u => u.PhoneNumber).HasMaxLength(20);
            e.Property(u => u.Role).HasMaxLength(10).IsRequired().HasConversion<string>();
            e.Property(u => u.Status).HasMaxLength(15).IsRequired().HasConversion<string>().HasDefaultValue(UserStatus.Pending);
            e.Property(u => u.ProfileImageUrl).HasMaxLength(500);
            e.Property(u => u.RefreshToken).HasMaxLength(512);
            e.Property(u => u.PasswordResetOtpHash).HasMaxLength(256);
            e.Property(u => u.PasswordResetOtpExpiresAt);
            e.Property(u => u.TwoFactorEnabled).HasDefaultValue(false);
            e.Property(u => u.TwoFactorSecret).HasMaxLength(80);
            e.Property(u => u.TwoFactorLoginChallenge).HasMaxLength(256);
            e.Property(u => u.TwoFactorLoginChallengeExpiresAt);
            e.Property(u => u.TwoFactorLoginEmailOtpHash).HasMaxLength(256);
            e.Property(u => u.TwoFactorLoginEmailOtpExpiresAt);
            e.Property(u => u.TwoFactorSetupEmailOtpHash).HasMaxLength(256);
            e.Property(u => u.TwoFactorSetupEmailOtpExpiresAt);
            e.Property(u => u.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            e.HasOne(u => u.BuyerProfile).WithOne(b => b.User)
                .HasForeignKey<BuyerProfile>(b => b.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(u => u.SellerProfile).WithOne(s => s.User)
                .HasForeignKey<SellerProfile>(s => s.UserId).OnDelete(DeleteBehavior.Cascade);
        }
    }
}
