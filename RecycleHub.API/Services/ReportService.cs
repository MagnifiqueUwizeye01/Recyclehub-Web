using Microsoft.EntityFrameworkCore;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.Data;
using RecycleHub.API.DTOs.ReportDtos;
using RecycleHub.API.Models;
using RecycleHub.API.Services.Interfaces;

namespace RecycleHub.API.Services
{
    public class ReportService : IReportService
    {
        private readonly AppDbContext _db;
        public ReportService(AppDbContext db) => _db = db;

        public async Task<(bool Success, string Message, ReportResponseDto? Data)> CreateReportAsync(int reporterUserId, CreateReportDto dto)
        {
            if (reporterUserId == dto.ReportedUserId)
                return (false, "You cannot report yourself.", null);

            var reported = await _db.Users.AsNoTracking().AnyAsync(u => u.UserId == dto.ReportedUserId);
            if (!reported) return (false, "Reported user not found.", null);

            if (dto.Reason.Contains("Other", StringComparison.OrdinalIgnoreCase)
                && string.IsNullOrWhiteSpace(dto.Details))
                return (false, "Please provide details when selecting Other.", null);

            var r = new Report
            {
                ReporterUserId = reporterUserId,
                ReportedUserId = dto.ReportedUserId,
                Reason = dto.Reason.Trim(),
                Details = string.IsNullOrWhiteSpace(dto.Details) ? null : dto.Details.Trim(),
                Context = dto.Context.Trim(),
                Status = ReportStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };
            _db.Reports.Add(r);
            await _db.SaveChangesAsync();

            return (true, "Report submitted.", await ToDtoByIdAsync(r.ReportId));
        }

        public async Task<PagedResult<ReportResponseDto>> GetReportsAsync(ReportFilterDto filter)
        {
            var q = _db.Reports
                .Include(r => r.ReporterUser)
                .Include(r => r.ReportedUser)
                .AsQueryable();
            if (filter.Status.HasValue) q = q.Where(r => r.Status == filter.Status.Value);

            var total = await q.CountAsync();
            var rows = await q.OrderByDescending(r => r.CreatedAt)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new PagedResult<ReportResponseDto>
            {
                Items = rows.Select(MapRow).ToList(),
                TotalCount = total,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize
            };
        }

        public async Task<ReportResponseDto?> GetByIdAsync(int reportId)
        {
            var r = await _db.Reports
                .Include(x => x.ReporterUser)
                .Include(x => x.ReportedUser)
                .FirstOrDefaultAsync(x => x.ReportId == reportId);
            return r == null ? null : MapRow(r);
        }

        public async Task<(bool Success, string Message)> UpdateStatusAsync(int reportId, ReportStatus status)
        {
            var r = await _db.Reports.FirstOrDefaultAsync(x => x.ReportId == reportId);
            if (r == null) return (false, "Report not found.");
            r.Status = status;
            r.ReviewedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, "Updated.");
        }

        public Task<int> GetPendingCountAsync()
            => _db.Reports.CountAsync(r => r.Status == ReportStatus.Pending);

        private async Task<ReportResponseDto?> ToDtoByIdAsync(int id)
        {
            var r = await _db.Reports
                .Include(x => x.ReporterUser)
                .Include(x => x.ReportedUser)
                .FirstOrDefaultAsync(x => x.ReportId == id);
            return r == null ? null : MapRow(r);
        }

        private static ReportResponseDto MapRow(Report r) => new()
        {
            ReportId = r.ReportId,
            ReporterUserId = r.ReporterUserId,
            ReporterName = $"{r.ReporterUser.FirstName} {r.ReporterUser.LastName}".Trim(),
            ReportedUserId = r.ReportedUserId,
            ReportedUserName = $"{r.ReportedUser.FirstName} {r.ReportedUser.LastName}".Trim(),
            Reason = r.Reason,
            Details = r.Details,
            Context = r.Context,
            Status = r.Status,
            CreatedAt = r.CreatedAt
        };
    }
}
