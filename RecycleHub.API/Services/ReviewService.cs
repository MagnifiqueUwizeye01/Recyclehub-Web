using Microsoft.EntityFrameworkCore;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.Data;
using RecycleHub.API.DTOs.ReviewDtos;
using RecycleHub.API.Models;
using RecycleHub.API.Services.Interfaces;

namespace RecycleHub.API.Services
{
    public class ReviewService : IReviewService
    {
        private readonly AppDbContext _db;
        private readonly ISellerProfileService _sellerProfile;

        public ReviewService(AppDbContext db, ISellerProfileService sellerProfile) { _db = db; _sellerProfile = sellerProfile; }

        public async Task<PagedResult<ReviewResponseDto>> GetAllReviewsAsync(ReviewFilterDto filter)
        {
            var q = BuildQuery();
            q = ApplyFilter(q, filter);
            return await Paginate(q, filter);
        }

        public async Task<PagedResult<ReviewResponseDto>> GetReviewsBySellerAsync(int sellerUserId, ReviewFilterDto filter)
        {
            var q = BuildQuery().Where(r => r.SellerUserId == sellerUserId);
            q = ApplyFilter(q, filter);
            return await Paginate(q, filter);
        }

        public async Task<PagedResult<ReviewResponseDto>> GetReviewsByBuyerAsync(int buyerUserId, ReviewFilterDto filter)
        {
            var q = BuildQuery().Where(r => r.BuyerUserId == buyerUserId);
            q = ApplyFilter(q, filter);
            return await Paginate(q, filter);
        }

        public async Task<ReviewResponseDto?> GetReviewByIdAsync(int reviewId)
        {
            var r = await BuildQuery().FirstOrDefaultAsync(x => x.ReviewId == reviewId);
            return r == null ? null : ToDto(r);
        }

        public async Task<(bool Success, string Message, ReviewResponseDto? Data)> CreateReviewAsync(int buyerUserId, CreateReviewDto dto)
        {
            var order = await _db.Orders.FindAsync(dto.OrderId);
            if (order == null) return (false, "Order not found.", null);
            if (order.BuyerUserId != buyerUserId) return (false, "You can only review your own orders.", null);
            if (order.Status != OrderStatus.Delivered) return (false, "You can only review delivered orders.", null);
            if (await _db.Reviews.AnyAsync(r => r.OrderId == dto.OrderId)) return (false, "Review already submitted for this order.", null);
            if (dto.Rating < 1 || dto.Rating > 5) return (false, "Rating must be between 1 and 5.", null);

            var review = new Review
            {
                OrderId      = dto.OrderId,
                BuyerUserId  = buyerUserId,
                SellerUserId = dto.SellerUserId,
                Rating       = dto.Rating,
                Comment      = dto.Comment,
                Status       = ReviewStatus.Visible,
                CreatedAt    = DateTime.UtcNow
            };
            _db.Reviews.Add(review);
            await _db.SaveChangesAsync();
            await _sellerProfile.UpdateSellerStatsAsync(dto.SellerUserId);

            await _db.Entry(review).Reference(r => r.BuyerUser).LoadAsync();
            await _db.Entry(review).Reference(r => r.SellerUser).LoadAsync();
            return (true, "Review submitted.", ToDto(review));
        }

        public async Task<(bool Success, string Message)> ModerateReviewAsync(int reviewId, ModerateReviewDto dto, int adminUserId)
        {
            var r = await _db.Reviews.FindAsync(reviewId);
            if (r == null) return (false, "Review not found.");
            r.Status          = dto.Status;
            r.HiddenReason    = dto.HiddenReason;
            r.HiddenByAdminId = dto.Status == ReviewStatus.Hidden ? adminUserId : null;
            r.UpdatedAt       = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await _sellerProfile.UpdateSellerStatsAsync(r.SellerUserId);
            return (true, $"Review {dto.Status}.");
        }

        public async Task<(bool Success, string Message)> DeleteReviewAsync(int reviewId)
        {
            var r = await _db.Reviews.FindAsync(reviewId);
            if (r == null) return (false, "Review not found.");
            var sellerUserId = r.SellerUserId;
            _db.Reviews.Remove(r);
            await _db.SaveChangesAsync();
            await _sellerProfile.UpdateSellerStatsAsync(sellerUserId);
            return (true, "Review deleted.");
        }

        private IQueryable<Review> BuildQuery() =>
            _db.Reviews.Include(r => r.BuyerUser).Include(r => r.SellerUser).AsQueryable();

        private static IQueryable<Review> ApplyFilter(IQueryable<Review> q, ReviewFilterDto f)
        {
            if (f.Status.HasValue)   q = q.Where(r => r.Status == f.Status);
            if (f.MinRating.HasValue)q = q.Where(r => r.Rating >= f.MinRating);
            if (f.SellerUserId.HasValue) q = q.Where(r => r.SellerUserId == f.SellerUserId);
            if (f.BuyerUserId.HasValue) q = q.Where(r => r.BuyerUserId == f.BuyerUserId);
            return q.OrderByDescending(r => r.CreatedAt);
        }

        private static async Task<PagedResult<ReviewResponseDto>> Paginate(IQueryable<Review> q, ReviewFilterDto f)
        {
            var total = await q.CountAsync();
            var items = await q.Skip((f.PageNumber - 1) * f.PageSize).Take(f.PageSize).ToListAsync();
            return new PagedResult<ReviewResponseDto> { Items = items.Select(ToDto).ToList(), TotalCount = total, PageNumber = f.PageNumber, PageSize = f.PageSize };
        }

        private static ReviewResponseDto ToDto(Review r) => new()
        {
            ReviewId      = r.ReviewId,
            OrderId       = r.OrderId,
            BuyerUserId   = r.BuyerUserId,
            BuyerUsername = r.BuyerUser?.Username ?? "",
            BuyerFullName = $"{r.BuyerUser?.FirstName} {r.BuyerUser?.LastName}",
            SellerUserId  = r.SellerUserId,
            SellerUsername= r.SellerUser?.Username ?? "",
            Rating        = r.Rating,
            Comment       = r.Comment,
            Status        = r.Status,
            HiddenReason  = r.HiddenReason,
            CreatedAt     = r.CreatedAt
        };
    }
}
