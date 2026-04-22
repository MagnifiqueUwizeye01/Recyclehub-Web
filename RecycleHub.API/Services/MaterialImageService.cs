using Microsoft.EntityFrameworkCore;
using RecycleHub.API.Data;
using RecycleHub.API.DTOs.MaterialImageDtos;
using RecycleHub.API.Helpers;
using RecycleHub.API.Models;
using RecycleHub.API.Services.Interfaces;
using Microsoft.AspNetCore.Http;

namespace RecycleHub.API.Services
{
    public class MaterialImageService : IMaterialImageService
    {
        private readonly AppDbContext _db;
        public MaterialImageService(AppDbContext db) => _db = db;

        public async Task<List<MaterialImageResponseDto>> GetImagesByMaterialAsync(int materialId) =>
            await _db.MaterialImages
                .Where(i => i.MaterialId == materialId)
                .OrderByDescending(i => i.IsPrimary).ThenBy(i => i.SortOrder)
                .Select(i => ToDto(i)).ToListAsync();

        public async Task<(bool Success, string Message, MaterialImageResponseDto? Data)> UploadImageAsync(
            int materialId, IFormFile file, string webRootPath, bool isPrimary)
        {
            var material = await _db.Materials.FindAsync(materialId);
            if (material == null) return (false, "Material not found.", null);

            var (saved, url, error) = await FileHelper.SaveImageAsync(file, webRootPath, "materials");
            if (!saved) return (false, error!, null);

            // Clear primary flag if new image is primary
            if (isPrimary)
                await _db.MaterialImages.Where(i => i.MaterialId == materialId && i.IsPrimary)
                    .ExecuteUpdateAsync(s => s.SetProperty(i => i.IsPrimary, false));

            var sortOrder = await _db.MaterialImages.CountAsync(i => i.MaterialId == materialId);
            var image = new MaterialImage
            {
                MaterialId = materialId, ImageUrl = url!, IsPrimary = isPrimary,
                SortOrder = sortOrder, UploadedAt = DateTime.UtcNow
            };
            _db.MaterialImages.Add(image);
            await _db.SaveChangesAsync();
            return (true, "Image uploaded.", ToDto(image));
        }

        public async Task<(bool Success, string Message)> DeleteImageAsync(int imageId, string webRootPath)
        {
            var image = await _db.MaterialImages.FindAsync(imageId);
            if (image == null) return (false, "Image not found.");
            FileHelper.DeleteFile(image.ImageUrl, webRootPath);
            _db.MaterialImages.Remove(image);
            await _db.SaveChangesAsync();
            return (true, "Image deleted.");
        }

        public async Task<(bool Success, string Message)> SetCoverImageAsync(int imageId)
        {
            var image = await _db.MaterialImages.FindAsync(imageId);
            if (image == null) return (false, "Image not found.");
            await _db.MaterialImages.Where(i => i.MaterialId == image.MaterialId && i.IsPrimary)
                .ExecuteUpdateAsync(s => s.SetProperty(i => i.IsPrimary, false));
            image.IsPrimary = true;
            await _db.SaveChangesAsync();
            return (true, "Cover image set.");
        }

        private static MaterialImageResponseDto ToDto(MaterialImage i) => new()
        {
            ImageId = i.ImageId, MaterialId = i.MaterialId, ImageUrl = i.ImageUrl,
            IsPrimary = i.IsPrimary, SortOrder = i.SortOrder, UploadedAt = i.UploadedAt
        };
    }
}
