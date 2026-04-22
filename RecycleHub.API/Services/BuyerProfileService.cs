using Microsoft.EntityFrameworkCore;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.Data;
using RecycleHub.API.DTOs.BuyerProfileDtos;
using RecycleHub.API.Models;
using RecycleHub.API.Services.Interfaces;

namespace RecycleHub.API.Services
{
    public class BuyerProfileService : IBuyerProfileService
    {
        private readonly AppDbContext _db;
        public BuyerProfileService(AppDbContext db) => _db = db;

        public async Task<PagedResult<BuyerProfileResponseDto>> GetAllBuyerProfilesAsync(BuyerProfileFilterDto filter)
        {
            var q = _db.BuyerProfiles.Include(b => b.User).AsQueryable();
            if (!string.IsNullOrWhiteSpace(filter.City)) q = q.Where(b => b.City == filter.City);
            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var s = filter.SearchTerm.ToLower();
                q = q.Where(b => b.CompanyName.ToLower().Contains(s) || b.User.Email.ToLower().Contains(s));
            }
            var total = await q.CountAsync();
            var items = await q.OrderBy(b => b.CompanyName)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(b => ToDto(b))
                .ToListAsync();
            return new PagedResult<BuyerProfileResponseDto> { Items = items, TotalCount = total, PageNumber = filter.PageNumber, PageSize = filter.PageSize };
        }

        public async Task<BuyerProfileResponseDto?> GetBuyerProfileByIdAsync(int buyerProfileId)
        {
            var b = await _db.BuyerProfiles.Include(x => x.User).FirstOrDefaultAsync(x => x.BuyerProfileId == buyerProfileId);
            return b == null ? null : ToDto(b);
        }

        public async Task<BuyerProfileResponseDto?> GetBuyerProfileByUserIdAsync(int userId)
        {
            var b = await _db.BuyerProfiles.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == userId);
            return b == null ? null : ToDto(b);
        }

        public async Task<(bool Success, string Message, BuyerProfileResponseDto? Data)> CreateBuyerProfileAsync(int userId, CreateBuyerProfileDto dto)
        {
            if (await _db.BuyerProfiles.AnyAsync(b => b.UserId == userId))
                return (false, "Buyer profile already exists.", null);

            var profile = new BuyerProfile
            {
                UserId      = userId,
                CompanyName = dto.CompanyName,
                IndustryType= dto.IndustryType,
                City        = dto.City,
                Address     = dto.Address,
                WebsiteUrl  = dto.WebsiteUrl,
                Description = dto.Description,
                CreatedAt   = DateTime.UtcNow
            };
            _db.BuyerProfiles.Add(profile);
            await _db.SaveChangesAsync();
            await _db.Entry(profile).Reference(b => b.User).LoadAsync();
            return (true, "Buyer profile created.", ToDto(profile));
        }

        public async Task<(bool Success, string Message, BuyerProfileResponseDto? Data)> UpdateBuyerProfileAsync(int userId, UpdateBuyerProfileDto dto)
        {
            var profile = await _db.BuyerProfiles.Include(b => b.User).FirstOrDefaultAsync(b => b.UserId == userId);
            if (profile == null) return (false, "Buyer profile not found.", null);
            if (dto.CompanyName  != null) profile.CompanyName  = dto.CompanyName;
            if (dto.IndustryType != null) profile.IndustryType = dto.IndustryType;
            if (dto.City         != null) profile.City         = dto.City;
            if (dto.Address      != null) profile.Address      = dto.Address;
            if (dto.WebsiteUrl   != null) profile.WebsiteUrl   = dto.WebsiteUrl;
            if (dto.Description  != null) profile.Description  = dto.Description;
            profile.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, "Buyer profile updated.", ToDto(profile));
        }

        public async Task<(bool Success, string Message)> DeleteBuyerProfileAsync(int userId)
        {
            var profile = await _db.BuyerProfiles.FirstOrDefaultAsync(b => b.UserId == userId);
            if (profile == null) return (false, "Buyer profile not found.");
            _db.BuyerProfiles.Remove(profile);
            await _db.SaveChangesAsync();
            return (true, "Buyer profile deleted.");
        }

        private static BuyerProfileResponseDto ToDto(BuyerProfile b) => new()
        {
            BuyerProfileId = b.BuyerProfileId,
            UserId         = b.UserId,
            Username       = b.User.Username,
            OwnerFullName  = $"{b.User.FirstName} {b.User.LastName}",
            Email          = b.User.Email,
            CompanyName    = b.CompanyName,
            IndustryType   = b.IndustryType,
            City           = b.City,
            Address        = b.Address,
            WebsiteUrl     = b.WebsiteUrl,
            Description    = b.Description,
            CreatedAt      = b.CreatedAt
        };
    }
}
