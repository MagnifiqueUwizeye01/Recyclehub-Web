using Microsoft.EntityFrameworkCore;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.Data;
using RecycleHub.API.DTOs.UserDtos;
using RecycleHub.API.Helpers;
using RecycleHub.API.Models;
using RecycleHub.API.Services.Interfaces;

namespace RecycleHub.API.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _db;
        public UserService(AppDbContext db) => _db = db;

        public async Task<PagedResult<UserResponseDto>> GetAllUsersAsync(UserFilterDto filter)
        {
            var q = _db.Users.AsQueryable();
            if (filter.Role.HasValue) q = q.Where(u => u.Role == filter.Role);
            if (filter.Status.HasValue) q = q.Where(u => u.Status == filter.Status);
            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var s = filter.SearchTerm.ToLower();
                q = q.Where(u => u.FirstName.ToLower().Contains(s)
                               || u.LastName.ToLower().Contains(s)
                               || u.Email.ToLower().Contains(s)
                               || u.Username.ToLower().Contains(s));
            }

            var total = await q.CountAsync();
            var items = await q.OrderByDescending(u => u.CreatedAt)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(u => ToDto(u))
                .ToListAsync();

            return new PagedResult<UserResponseDto> { Items = items, TotalCount = total, PageNumber = filter.PageNumber, PageSize = filter.PageSize };
        }

        public async Task<UserResponseDto?> GetUserByIdAsync(int userId)
        {
            var u = await _db.Users.FindAsync(userId);
            return u == null ? null : ToDto(u);
        }

        public async Task<(bool Success, string Message, UserResponseDto? Data)> UpdateUserAsync(int userId, UpdateUserDto dto)
        {
            var u = await _db.Users.FindAsync(userId);
            if (u == null) return (false, "User not found.", null);

            if (!string.IsNullOrWhiteSpace(dto.Email)
                && !string.Equals(u.Email, dto.Email.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                var emailTaken = await _db.Users.AnyAsync(x =>
                    x.UserId != userId && x.Email.ToLower() == dto.Email!.Trim().ToLowerInvariant());
                if (emailTaken) return (false, "That email is already in use.", null);
                u.Email = dto.Email.Trim();
            }

            if (!string.IsNullOrWhiteSpace(dto.Username)
                && !string.Equals(u.Username, dto.Username.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                var userTaken = await _db.Users.AnyAsync(x =>
                    x.UserId != userId && x.Username.ToLower() == dto.Username!.Trim().ToLowerInvariant());
                if (userTaken) return (false, "That username is already taken.", null);
                u.Username = dto.Username.Trim();
            }

            if (dto.Role.HasValue) u.Role = dto.Role.Value;

            if (dto.FirstName != null) u.FirstName = dto.FirstName;
            if (dto.LastName != null) u.LastName = dto.LastName;
            if (dto.PhoneNumber != null) u.PhoneNumber = dto.PhoneNumber;
            if (dto.Gender.HasValue) u.Gender = dto.Gender.Value;
            if (dto.ProfileImageUrl != null) u.ProfileImageUrl = dto.ProfileImageUrl;
            if (dto.Status.HasValue) u.Status = dto.Status.Value;
            u.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, "User updated.", ToDto(u));
        }

        public async Task<(bool Success, string Message, UserResponseDto? Data)> CreateUserByAdminAsync(CreateUserByAdminDto dto)
        {
            var email = dto.Email?.Trim() ?? string.Empty;
            var username = dto.Username?.Trim() ?? string.Empty;
            if (email.Length == 0 || username.Length == 0)
                return (false, "Email and username are required.", null);
            if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 8)
                return (false, "Password must be at least 8 characters.", null);

            var exists = await _db.Users.AnyAsync(u =>
                u.Email.ToLower() == email.ToLowerInvariant() || u.Username.ToLower() == username.ToLowerInvariant());
            if (exists) return (false, "Email or username already exists.", null);

            var user = new User
            {
                Username = username,
                FirstName = dto.FirstName?.Trim() ?? "",
                LastName = dto.LastName?.Trim() ?? "",
                Email = email,
                PhoneNumber = string.IsNullOrWhiteSpace(dto.PhoneNumber) ? null : dto.PhoneNumber.Trim(),
                Gender = dto.Gender,
                Role = dto.Role,
                Status = UserStatus.Active,
                PasswordHash = PasswordHasher.Hash(dto.Password),
                CreatedAt = DateTime.UtcNow,
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            if (dto.Role == UserRole.Buyer)
            {
                var bp = new BuyerProfile
                {
                    UserId = user.UserId,
                    CompanyName = string.IsNullOrWhiteSpace(dto.CompanyName)
                        ? $"{user.FirstName}'s Business"
                        : dto.CompanyName.Trim(),
                    IndustryType = "General",
                    City = string.IsNullOrWhiteSpace(dto.City) ? "Unknown" : dto.City.Trim(),
                    Address = string.IsNullOrWhiteSpace(dto.Address) ? "Unknown" : dto.Address.Trim(),
                    CreatedAt = DateTime.UtcNow,
                };
                _db.BuyerProfiles.Add(bp);
            }
            else if (dto.Role == UserRole.Seller)
            {
                var sp = new SellerProfile
                {
                    UserId = user.UserId,
                    CompanyName = string.IsNullOrWhiteSpace(dto.CompanyName)
                        ? $"{user.FirstName}'s Store"
                        : dto.CompanyName.Trim(),
                    LicenseDocument = "pending_license.pdf",
                    City = string.IsNullOrWhiteSpace(dto.City) ? "Unknown" : dto.City.Trim(),
                    Address = string.IsNullOrWhiteSpace(dto.Address) ? "Unknown" : dto.Address.Trim(),
                    VerificationStatus = VerificationStatus.Pending,
                    CreatedAt = DateTime.UtcNow,
                };
                _db.SellerProfiles.Add(sp);
            }

            await _db.SaveChangesAsync();
            return (true, "User created.", ToDto(user));
        }

        public async Task<(bool Success, string Message)> DeleteUserAsync(int userId)
        {
            var u = await _db.Users.FindAsync(userId);
            if (u == null) return (false, "User not found.");
            if (u.Role == UserRole.Admin)
                return (false, "Deleting administrator accounts is not allowed here.");
            _db.Users.Remove(u);
            await _db.SaveChangesAsync();
            return (true, "User deleted.");
        }

        public async Task<(bool Success, string Message)> SuspendUserAsync(int userId)
        {
            var u = await _db.Users.FindAsync(userId);
            if (u == null) return (false, "User not found.");
            u.Status    = UserStatus.Suspended;
            u.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, "User suspended.");
        }

        public async Task<(bool Success, string Message)> ActivateUserAsync(int userId)
        {
            var u = await _db.Users.FindAsync(userId);
            if (u == null) return (false, "User not found.");
            u.Status    = UserStatus.Active;
            u.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (true, "User activated.");
        }

        private static UserResponseDto ToDto(Models.User u) => new()
        {
            UserId         = u.UserId,
            Username       = u.Username,
            FirstName      = u.FirstName,
            LastName       = u.LastName,
            Email          = u.Email,
            PhoneNumber    = u.PhoneNumber,
            Role           = u.Role,
            Status         = u.Status,
            Gender         = u.Gender,
            ProfileImageUrl= u.ProfileImageUrl,
            CreatedAt      = u.CreatedAt,
            LastLoginAt    = u.LastLoginAt
        };
    }
}
