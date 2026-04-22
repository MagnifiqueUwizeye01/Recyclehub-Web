using Microsoft.EntityFrameworkCore;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.Data;
using RecycleHub.API.DTOs.MaterialDtos;
using RecycleHub.API.Models;
using RecycleHub.API.Services.Interfaces;

namespace RecycleHub.API.Services
{
    public class MaterialService : IMaterialService
    {
        private readonly AppDbContext _db;
        public MaterialService(AppDbContext db) => _db = db;

        public async Task<PagedResult<MaterialResponseDto>> GetAllMaterialsAsync(MaterialFilterDto filter)
        {
            var q = _db.Materials
                .Include(m => m.SellerUser)
                .Include(m => m.Images)
                .AsQueryable();

            if (filter.MaterialType.HasValue) q = q.Where(m => m.MaterialType == filter.MaterialType);
            if (filter.Status.HasValue)       q = q.Where(m => m.Status       == filter.Status);
            if (!string.IsNullOrWhiteSpace(filter.City)) q = q.Where(m => m.City == filter.City);
            if (filter.MinPrice.HasValue)     q = q.Where(m => m.UnitPrice >= filter.MinPrice);
            if (filter.MaxPrice.HasValue)     q = q.Where(m => m.UnitPrice <= filter.MaxPrice);
            if (filter.SellerUserId.HasValue) q = q.Where(m => m.SellerUserId == filter.SellerUserId);
            if (filter.IsSmartSwap == true) q = q.Where(m => m.IsSmartSwap);
            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var s = filter.SearchTerm.ToLower();
                q = q.Where(m => m.Title.ToLower().Contains(s) || (m.Description != null && m.Description.ToLower().Contains(s)));
            }

            q = filter.SortBy switch
            {
                "UnitPrice"  => filter.SortDescending ? q.OrderByDescending(m => m.UnitPrice)  : q.OrderBy(m => m.UnitPrice),
                "ViewCount"  => filter.SortDescending ? q.OrderByDescending(m => m.ViewCount)  : q.OrderBy(m => m.ViewCount),
                _            => filter.SortDescending ? q.OrderByDescending(m => m.CreatedAt)  : q.OrderBy(m => m.CreatedAt)
            };

            var total = await q.CountAsync();
            var items = await q.Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new PagedResult<MaterialResponseDto>
            {
                Items       = items.Select(ToDto).ToList(),
                TotalCount  = total,
                PageNumber  = filter.PageNumber,
                PageSize    = filter.PageSize
            };
        }

        public async Task<MaterialResponseDto?> GetMaterialByIdAsync(int materialId)
        {
            var m = await _db.Materials
                .Include(x => x.SellerUser)
                .ThenInclude(u => u.SellerProfile)
                .Include(x => x.Images)
                .FirstOrDefaultAsync(x => x.MaterialId == materialId);
            return m == null ? null : ToDto(m);
        }

        public async Task<PagedResult<MaterialResponseDto>> GetMaterialsBySellerAsync(int sellerUserId, MaterialFilterDto filter)
        {
            filter.SellerUserId = sellerUserId;
            return await GetAllMaterialsAsync(filter);
        }

        public async Task<(bool Success, string Message, MaterialResponseDto? Data)> CreateMaterialAsync(int sellerUserId, CreateMaterialDto dto)
        {
            // Validate seller profile is verified
            var sellerProfile = await _db.SellerProfiles.FirstOrDefaultAsync(s => s.UserId == sellerUserId);
            if (sellerProfile == null) return (false, "Seller profile not found.", null);
            if (sellerProfile.VerificationStatus != VerificationStatus.Verified)
                return (false, "Your seller profile must be verified before listing materials.", null);

            var isSwap = dto.IsSmartSwap;
            var material = new Material
            {
                SellerUserId = sellerUserId,
                Title        = dto.Title,
                Description  = dto.Description,
                MaterialType = dto.MaterialType,
                Quantity     = dto.Quantity,
                UnitPrice    = isSwap ? 0 : dto.UnitPrice,
                Unit         = dto.Unit,
                MinOrderQty  = dto.MinOrderQty,
                City         = dto.City,
                Address      = dto.Address,
                Grade        = dto.Grade,
                IsSmartSwap  = isSwap,
                SmartSwapDescription = isSwap ? dto.SmartSwapDescription?.Trim() : null,
                Status       = MaterialStatus.Available,
                CreatedAt    = DateTime.UtcNow
            };
            _db.Materials.Add(material);
            await _db.SaveChangesAsync();
            material = await _db.Materials
                .Include(x => x.SellerUser)!.ThenInclude(u => u.SellerProfile)
                .Include(x => x.Images)
                .FirstAsync(x => x.MaterialId == material.MaterialId);
            return (true, "Material listing created and is visible to buyers.", ToDto(material));
        }

        public async Task<(bool Success, string Message, MaterialResponseDto? Data)> UpdateMaterialAsync(int materialId, UpdateMaterialDto dto)
        {
            var m = await _db.Materials.Include(x => x.SellerUser).Include(x => x.Images).FirstOrDefaultAsync(x => x.MaterialId == materialId);
            if (m == null) return (false, "Material not found.", null);
            if (dto.Title       != null) m.Title       = dto.Title;
            if (dto.Description != null) m.Description = dto.Description;
            if (dto.Quantity    != null) m.Quantity     = dto.Quantity.Value;
            if (dto.UnitPrice   != null) m.UnitPrice    = dto.UnitPrice.Value;
            if (dto.Unit        != null) m.Unit         = dto.Unit;
            if (dto.MinOrderQty != null) m.MinOrderQty  = dto.MinOrderQty.Value;
            if (dto.City        != null) m.City         = dto.City;
            if (dto.Address     != null) m.Address      = dto.Address;
            if (dto.Grade       != null) m.Grade        = dto.Grade;
            if (dto.IsSmartSwap.HasValue)
            {
                m.IsSmartSwap = dto.IsSmartSwap.Value;
                if (m.IsSmartSwap)
                {
                    m.UnitPrice = 0;
                    m.SmartSwapDescription = dto.SmartSwapDescription?.Trim();
                }
                else
                {
                    m.SmartSwapDescription = null;
                    if (dto.UnitPrice.HasValue) m.UnitPrice = dto.UnitPrice.Value;
                }
            }
            m.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, "Material updated.", ToDto(m));
        }

        public async Task<(bool Success, string Message)> DeleteMaterialAsync(int materialId)
        {
            var m = await _db.Materials.FindAsync(materialId);
            if (m == null) return (false, "Material not found.");
            _db.Materials.Remove(m);
            await _db.SaveChangesAsync();
            return (true, "Material deleted.");
        }

        public async Task<(bool Success, string Message)> SubmitForVerificationAsync(int materialId)
        {
            var m = await _db.Materials.FindAsync(materialId);
            if (m == null) return (false, "Material not found.");
            // Legacy rows may still be Pending; promote to live without admin approval.
            if (m.Status == MaterialStatus.Pending)
            {
                m.Status = MaterialStatus.Available;
                m.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
            return (true, "Listing is available on the marketplace.");
        }

        public async Task<(bool Success, string Message)> VerifyMaterialAsync(int materialId, VerifyMaterialDto dto, int adminUserId)
        {
            var m = await _db.Materials.FindAsync(materialId);
            if (m == null) return (false, "Material not found.");
            m.Status            = dto.Status;
            m.AdminNote         = dto.AdminNote;
            m.VerifiedByAdminId = adminUserId;
            m.VerifiedAt        = dto.Status == MaterialStatus.Verified || dto.Status == MaterialStatus.Available ? DateTime.UtcNow : null;
            m.UpdatedAt         = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, $"Material status updated to {dto.Status}.");
        }

        public async Task<(bool Success, string Message)> MarkAsSoldAsync(int materialId)
        {
            var m = await _db.Materials.FindAsync(materialId);
            if (m == null) return (false, "Material not found.");
            m.Status    = MaterialStatus.Sold;
            m.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, "Material marked as sold.");
        }

        public async Task IncrementViewCountAsync(int materialId)
        {
            var m = await _db.Materials.FindAsync(materialId);
            if (m != null)
            {
                m.ViewCount++;
                try { await _db.SaveChangesAsync(); }
                catch { /* Ignore view count update errors */ }
            }
        }

        private static MaterialResponseDto ToDto(Material m) => new()
        {
            MaterialId       = m.MaterialId,
            SellerUserId     = m.SellerUserId,
            SellerUsername   = m.SellerUser?.Username ?? "Unknown",
            SellerCompanyName= m.SellerUser?.SellerProfile?.CompanyName ?? "RecycleHub Seller",
            SellerCity       = m.SellerUser?.SellerProfile?.City ?? m.City,
            SellerIsVerified = m.SellerUser?.SellerProfile?.VerificationStatus == VerificationStatus.Verified,
            SellerRating     = m.SellerUser?.SellerProfile?.AverageRating ?? 0,
            Title            = m.Title ?? "Untitled Material",
            Description      = m.Description,
            MaterialType     = m.MaterialType,
            Status           = m.Status,
            Quantity         = m.Quantity,
            UnitPrice        = m.UnitPrice,
            Unit             = m.Unit ?? "unit",
            MinOrderQty      = m.MinOrderQty,
            City             = m.City ?? "",
            Address          = m.Address ?? "",
            Grade            = m.Grade,
            AdminNote        = m.AdminNote,
            ViewCount        = m.ViewCount,
            PrimaryImageUrl  = m.Images?.FirstOrDefault(i => i.IsPrimary)?.ImageUrl ?? m.Images?.FirstOrDefault()?.ImageUrl,
            ImageUrls        = m.Images?.Select(i => i.ImageUrl).ToList() ?? new List<string>(),
            CreatedAt        = m.CreatedAt,
            IsSmartSwap      = m.IsSmartSwap,
            SmartSwapDescription = m.SmartSwapDescription
        };
    }
}
