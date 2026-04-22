using Microsoft.EntityFrameworkCore;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.Data;
using RecycleHub.API.DTOs.CertificateDtos;
using RecycleHub.API.DTOs.SellerProfileDtos;
using RecycleHub.API.Models;
using RecycleHub.API.Services.Interfaces;

namespace RecycleHub.API.Services
{
    public class SellerProfileService : ISellerProfileService
    {
        private readonly AppDbContext _db;
        public SellerProfileService(AppDbContext db) => _db = db;

        public async Task<PagedResult<SellerProfileResponseDto>> GetAllSellerProfilesAsync(SellerProfileFilterDto filter)
        {
            var q = _db.SellerProfiles.Include(s => s.User).AsQueryable();
            if (filter.VerificationStatus.HasValue) q = q.Where(s => s.VerificationStatus == filter.VerificationStatus);
            if (!string.IsNullOrWhiteSpace(filter.City)) q = q.Where(s => s.City == filter.City);
            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var t = filter.SearchTerm.ToLower();
                q = q.Where(s => s.CompanyName.ToLower().Contains(t) || s.User.Email.ToLower().Contains(t));
            }
            var total = await q.CountAsync();
            var items = await q.OrderByDescending(s => s.AverageRating)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(s => ToDto(s)).ToListAsync();
            return new PagedResult<SellerProfileResponseDto> { Items = items, TotalCount = total, PageNumber = filter.PageNumber, PageSize = filter.PageSize };
        }

        public async Task<SellerProfileResponseDto?> GetSellerProfileByIdAsync(int sellerProfileId)
        {
            var s = await _db.SellerProfiles.Include(x => x.User).FirstOrDefaultAsync(x => x.SellerProfileId == sellerProfileId);
            return s == null ? null : ToDto(s);
        }

        public async Task<SellerProfileResponseDto?> GetSellerProfileByUserIdAsync(int userId)
        {
            var s = await _db.SellerProfiles.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == userId);
            return s == null ? null : ToDto(s);
        }

        public async Task<PublicSellerProfileDto?> GetPublicSellerProfileAsync(int userId)
        {
            var s = await _db.SellerProfiles
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.UserId == userId);
            if (s == null) return null;

            var certs = await _db.SellerCertificates.AsNoTracking()
                .Where(c => c.SellerUserId == userId)
                .OrderByDescending(c => c.IssueDate)
                .Select(c => new PublicSellerCertificateDto
                {
                    CertificateName = c.CertificateName,
                    IssuingAuthority = c.IssuingAuthority,
                    IssueDate = c.IssueDate,
                    ExpiryDate = c.ExpiryDate
                }).ToListAsync();

            var listingCount = await _db.Materials.CountAsync(m => m.SellerUserId == userId && m.Status == MaterialStatus.Available);

            return new PublicSellerProfileDto
            {
                UserId = userId,
                CompanyName = s.CompanyName,
                City = s.City,
                Description = s.Description,
                IsVerified = s.VerificationStatus == VerificationStatus.Verified,
                MemberSinceYear = s.CreatedAt.Year,
                ProfileImageUrl = s.User.ProfileImageUrl,
                TotalListings = listingCount,
                TotalSales = s.TotalSales,
                AverageRating = s.AverageRating,
                ResponseRatePercent = null,
                Certificates = certs
            };
        }

        public async Task<(bool Success, string Message, SellerProfileResponseDto? Data)> CreateSellerProfileAsync(int userId, CreateSellerProfileDto dto)
        {
            if (await _db.SellerProfiles.AnyAsync(s => s.UserId == userId))
                return (false, "Seller profile already exists.", null);

            var profile = new SellerProfile
            {
                UserId             = userId,
                CompanyName        = dto.CompanyName,
                LicenseDocument    = dto.LicenseDocument,
                City               = dto.City,
                Address            = dto.Address,
                WebsiteUrl         = dto.WebsiteUrl,
                Description        = dto.Description,
                VerificationStatus = VerificationStatus.Pending,
                CreatedAt          = DateTime.UtcNow
            };
            _db.SellerProfiles.Add(profile);
            await _db.SaveChangesAsync();
            await _db.Entry(profile).Reference(s => s.User).LoadAsync();
            return (true, "Seller profile created. Pending admin verification.", ToDto(profile));
        }

        public async Task<(bool Success, string Message, SellerProfileResponseDto? Data)> UpdateSellerProfileAsync(int userId, UpdateSellerProfileDto dto)
        {
            var profile = await _db.SellerProfiles.Include(s => s.User).FirstOrDefaultAsync(s => s.UserId == userId);
            if (profile == null) return (false, "Seller profile not found.", null);
            if (dto.CompanyName     != null) profile.CompanyName     = dto.CompanyName;
            if (dto.LicenseDocument != null) profile.LicenseDocument = dto.LicenseDocument;
            if (dto.City            != null) profile.City            = dto.City;
            if (dto.Address         != null) profile.Address         = dto.Address;
            if (dto.WebsiteUrl      != null) profile.WebsiteUrl      = dto.WebsiteUrl;
            if (dto.Description     != null) profile.Description     = dto.Description;
            profile.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, "Seller profile updated.", ToDto(profile));
        }

        public async Task<(bool Success, string Message)> VerifySellerProfileAsync(int userId, VerifySellerProfileDto dto, int adminUserId)
        {
            var profile = await _db.SellerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (profile == null) return (false, "Seller profile not found.");
            profile.VerificationStatus = dto.VerificationStatus;
            profile.VerificationNote   = dto.VerificationNote;
            profile.VerifiedByAdminId  = adminUserId;
            profile.VerifiedAt         = dto.VerificationStatus == VerificationStatus.Verified ? DateTime.UtcNow : null;
            profile.UpdatedAt          = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, $"Seller profile {dto.VerificationStatus}.");
        }

        public async Task<(bool Success, string Message)> DeleteSellerProfileAsync(int userId)
        {
            var profile = await _db.SellerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (profile == null) return (false, "Seller profile not found.");
            _db.SellerProfiles.Remove(profile);
            await _db.SaveChangesAsync();
            return (true, "Seller profile deleted.");
        }

        public async Task UpdateSellerStatsAsync(int sellerUserId)
        {
            var profile = await _db.SellerProfiles.FirstOrDefaultAsync(s => s.UserId == sellerUserId);
            if (profile == null) return;
            profile.TotalSales = await _db.Orders.CountAsync(o => o.SellerUserId == sellerUserId && o.Status == OrderStatus.Delivered);
            var ratings = await _db.Reviews
                .Where(r => r.SellerUserId == sellerUserId && r.Status == ReviewStatus.Visible)
                .Select(r => (decimal)r.Rating).ToListAsync();
            profile.AverageRating = ratings.Any() ? Math.Round(ratings.Average(), 2) : 0m;
            profile.UpdatedAt     = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        private static SellerProfileResponseDto ToDto(SellerProfile s) => new()
        {
            SellerProfileId    = s.SellerProfileId,
            UserId             = s.UserId,
            Username           = s.User.Username,
            OwnerFullName      = $"{s.User.FirstName} {s.User.LastName}",
            Email              = s.User.Email,
            CompanyName        = s.CompanyName,
            LicenseDocument    = s.LicenseDocument,
            VerificationStatus = s.VerificationStatus,
            VerificationNote   = s.VerificationNote,
            VerifiedAt         = s.VerifiedAt,
            City               = s.City,
            Address            = s.Address,
            WebsiteUrl         = s.WebsiteUrl,
            Description        = s.Description,
            TotalSales         = s.TotalSales,
            AverageRating      = s.AverageRating,
            CreatedAt          = s.CreatedAt
        };
    }
}
