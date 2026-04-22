using Microsoft.EntityFrameworkCore;
using RecycleHub.API.Models;

namespace RecycleHub.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<BuyerProfile> BuyerProfiles => Set<BuyerProfile>();
        public DbSet<SellerProfile> SellerProfiles => Set<SellerProfile>();
        public DbSet<Material> Materials => Set<Material>();
        public DbSet<MaterialImage> MaterialImages => Set<MaterialImage>();
        public DbSet<AIAnalysisResult> AIAnalysisResults => Set<AIAnalysisResult>();
        public DbSet<Order> Orders => Set<Order>();
        public DbSet<Payment> Payments => Set<Payment>();
        public DbSet<Message> Messages => Set<Message>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<Review> Reviews => Set<Review>();
        public DbSet<SmartSwapMatch> SmartSwapMatches => Set<SmartSwapMatch>();
        public DbSet<SellerCertificate> SellerCertificates => Set<SellerCertificate>();
        public DbSet<CertificateUpdateRequest> CertificateUpdateRequests => Set<CertificateUpdateRequest>();
        public DbSet<Report> Reports => Set<Report>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // All entity configurations are in Data/Configurations/
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        }
    }
}
