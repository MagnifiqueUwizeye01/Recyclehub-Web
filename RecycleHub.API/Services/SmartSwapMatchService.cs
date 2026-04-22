using Microsoft.EntityFrameworkCore;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.Data;
using RecycleHub.API.DTOs.SmartSwapMatchDtos;
using RecycleHub.API.Models;
using RecycleHub.API.Services.Interfaces;

namespace RecycleHub.API.Services
{
    public class SmartSwapMatchService : ISmartSwapMatchService
    {
        private readonly AppDbContext _db;
        public SmartSwapMatchService(AppDbContext db) => _db = db;

        public async Task<PagedResult<SmartSwapMatchResponseDto>> GetMatchesForBuyerAsync(int buyerUserId, int page, int pageSize)
        {
            var q = BuildQuery().Where(m => m.SuggestedBuyerUserId == buyerUserId).OrderByDescending(m => m.MatchScore);
            return await Paginate(q, page, pageSize);
        }

        public async Task<PagedResult<SmartSwapMatchResponseDto>> GetMatchesForSellerAsync(int sellerUserId, int page, int pageSize)
        {
            var q = BuildQuery().Where(m => m.SuggestedSellerUserId == sellerUserId).OrderByDescending(m => m.MatchScore);
            return await Paginate(q, page, pageSize);
        }

        public async Task<SmartSwapMatchResponseDto?> GetMatchByIdAsync(int matchId)
        {
            var m = await BuildQuery().FirstOrDefaultAsync(x => x.MatchId == matchId);
            return m == null ? null : ToDto(m);
        }

        public async Task<(bool Success, string Message, SmartSwapMatchResponseDto? Data)> CreateMatchAsync(CreateSmartSwapMatchDto dto)
        {
            var material = await _db.Materials.FindAsync(dto.MaterialId);
            if (material == null) return (false, "Material not found.", null);
            var match = new SmartSwapMatch
            {
                MaterialId = dto.MaterialId, SuggestedBuyerUserId = dto.SuggestedBuyerUserId,
                SuggestedSellerUserId = dto.SuggestedSellerUserId, MatchScore = dto.MatchScore,
                SuggestedReason = dto.SuggestedReason, MatchStatus = MatchStatus.Suggested, CreatedAt = DateTime.UtcNow
            };
            _db.SmartSwapMatches.Add(match);
            await _db.SaveChangesAsync();
            await _db.Entry(match).Reference(m => m.Material).LoadAsync();
            await _db.Entry(match).Reference(m => m.SuggestedBuyerUser).LoadAsync();
            await _db.Entry(match).Reference(m => m.SuggestedSellerUser).LoadAsync();
            return (true, "Match created.", ToDto(match));
        }

        public async Task<(bool Success, string Message)> UpdateMatchStatusAsync(int matchId, UpdateMatchStatusDto dto)
        {
            var match = await _db.SmartSwapMatches.FindAsync(matchId);
            if (match == null) return (false, "Match not found.");
            match.MatchStatus  = dto.MatchStatus;
            match.ViewedAt     = dto.MatchStatus == MatchStatus.Viewed ? DateTime.UtcNow : match.ViewedAt;
            match.RespondedAt  = dto.MatchStatus is MatchStatus.Accepted or MatchStatus.Rejected ? DateTime.UtcNow : match.RespondedAt;
            await _db.SaveChangesAsync();
            return (true, $"Match {dto.MatchStatus}.");
        }

        public async Task<List<SmartSwapMatchResponseDto>> GenerateMatchesForMaterialAsync(int materialId)
        {
            var material = await _db.Materials.FindAsync(materialId);
            if (material == null) return new List<SmartSwapMatchResponseDto>();

            // Find buyers — simple: any active buyer user
            var buyers = await _db.Users
                .Where(u => u.Role == UserRole.Buyer && u.Status == UserStatus.Active)
                .Take(5).ToListAsync();

            var matches = new List<SmartSwapMatch>();
            foreach (var buyer in buyers)
            {
                var score = (decimal)new Random().Next(50, 96);
                matches.Add(new SmartSwapMatch
                {
                    MaterialId = materialId, SuggestedBuyerUserId = buyer.UserId,
                    MatchScore = score, MatchStatus = MatchStatus.Suggested,
                    SuggestedReason = $"Buyer may need {material.MaterialType} type materials in {material.City}.",
                    CreatedAt = DateTime.UtcNow
                });
            }
            _db.SmartSwapMatches.AddRange(matches);
            await _db.SaveChangesAsync();

            var ids = matches.Select(m => m.MatchId).ToList();
            var result = await BuildQuery().Where(m => ids.Contains(m.MatchId)).ToListAsync();
            return result.Select(ToDto).ToList();
        }

        private IQueryable<SmartSwapMatch> BuildQuery() =>
            _db.SmartSwapMatches
                .Include(m => m.Material)
                .Include(m => m.SuggestedBuyerUser)
                .Include(m => m.SuggestedSellerUser)
                .AsQueryable();

        private static async Task<PagedResult<SmartSwapMatchResponseDto>> Paginate(IQueryable<SmartSwapMatch> q, int page, int pageSize)
        {
            var total = await q.CountAsync();
            var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            return new PagedResult<SmartSwapMatchResponseDto> { Items = items.Select(ToDto).ToList(), TotalCount = total, PageNumber = page, PageSize = pageSize };
        }

        private static SmartSwapMatchResponseDto ToDto(SmartSwapMatch m) => new()
        {
            MatchId = m.MatchId, MaterialId = m.MaterialId,
            MaterialTitle = m.Material?.Title ?? "",
            MaterialType  = m.Material?.MaterialType.ToString() ?? "",
            SuggestedBuyerUserId  = m.SuggestedBuyerUserId,
            BuyerUsername         = m.SuggestedBuyerUser?.Username,
            SuggestedSellerUserId = m.SuggestedSellerUserId,
            SellerUsername        = m.SuggestedSellerUser?.Username,
            MatchScore = m.MatchScore, SuggestedReason = m.SuggestedReason,
            MatchStatus = m.MatchStatus, ViewedAt = m.ViewedAt, RespondedAt = m.RespondedAt, CreatedAt = m.CreatedAt
        };
    }
}
