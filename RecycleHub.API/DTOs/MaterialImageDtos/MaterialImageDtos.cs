namespace RecycleHub.API.DTOs.MaterialImageDtos
{
    public class MaterialImageResponseDto
    {
        public int ImageId { get; set; }
        public int MaterialId { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsPrimary { get; set; }
        public int SortOrder { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}
