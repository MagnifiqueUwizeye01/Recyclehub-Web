namespace RecycleHub.API.Helpers
{
    public static class FileHelper
    {
        private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        private static readonly string[] CertificateExtensions = { ".pdf", ".jpg", ".jpeg", ".png", ".webp" };
        private const long MaxBytes = 10L * 1024 * 1024; // 10 MB
        private const long CertificateMaxBytes = 15L * 1024 * 1024; // 15 MB

        /// <summary>Saves an uploaded image under wwwroot/uploads/{folder}/ and returns the relative URL.</summary>
        public static async Task<(bool Success, string? Url, string? Error)> SaveImageAsync(
            IFormFile file, string webRootPath, string folder)
        {
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(ext))
                return (false, null, $"File type '{ext}' is not allowed.");
            if (file.Length > MaxBytes)
                return (false, null, "File size exceeds the 10 MB limit.");

            var uploadPath = Path.Combine(webRootPath, "uploads", folder);
            Directory.CreateDirectory(uploadPath);

            var fileName = $"{Guid.NewGuid()}{ext}";
            var filePath = Path.Combine(uploadPath, fileName);

            await using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);

            var relativeUrl = $"/uploads/{folder}/{fileName}";
            return (true, relativeUrl, null);
        }

        /// <summary>Deletes a file given its relative URL (e.g. /uploads/materials/xyz.jpg).</summary>
        public static void DeleteFile(string relativeUrl, string webRootPath)
        {
            if (string.IsNullOrWhiteSpace(relativeUrl)) return;
            var path = Path.Combine(webRootPath, relativeUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            if (File.Exists(path)) File.Delete(path);
        }

        /// <summary>PDF or image certificate upload.</summary>
        public static async Task<(bool Success, string? Url, string? Error)> SaveCertificateDocumentAsync(
            IFormFile file, string webRootPath, string folder)
        {
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!CertificateExtensions.Contains(ext))
                return (false, null, $"File type '{ext}' is not allowed for certificates.");
            if (file.Length > CertificateMaxBytes)
                return (false, null, "File size exceeds the 15 MB limit.");

            var uploadPath = Path.Combine(webRootPath, "uploads", folder);
            Directory.CreateDirectory(uploadPath);

            var fileName = $"{Guid.NewGuid()}{ext}";
            var filePath = Path.Combine(uploadPath, fileName);

            await using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);

            var relativeUrl = $"/uploads/{folder}/{fileName}";
            return (true, relativeUrl, null);
        }
    }
}
