using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RecycleHub.API.Models;

namespace RecycleHub.API.Data.Configurations
{
    public class MaterialImageConfiguration : IEntityTypeConfiguration<MaterialImage>
    {
        public void Configure(EntityTypeBuilder<MaterialImage> e)
        {
            e.ToTable("MaterialImages");
            e.HasKey(i => i.ImageId);
            e.Property(i => i.ImageId).UseIdentityColumn();
            e.Property(i => i.ImageUrl).HasMaxLength(500).IsRequired();
            e.Property(i => i.IsPrimary).HasDefaultValue(false);
            e.Property(i => i.SortOrder).HasDefaultValue(0);
            e.Property(i => i.UploadedAt).HasDefaultValueSql("GETUTCDATE()");
        }
    }
}
