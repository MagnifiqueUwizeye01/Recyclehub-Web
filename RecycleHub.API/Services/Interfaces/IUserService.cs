using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.UserDtos;

namespace RecycleHub.API.Services.Interfaces
{
    public interface IUserService
    {
        Task<PagedResult<UserResponseDto>> GetAllUsersAsync(UserFilterDto filter);
        Task<UserResponseDto?> GetUserByIdAsync(int userId);
        Task<(bool Success, string Message, UserResponseDto? Data)> UpdateUserAsync(int userId, UpdateUserDto dto);
        Task<(bool Success, string Message, UserResponseDto? Data)> CreateUserByAdminAsync(CreateUserByAdminDto dto);
        Task<(bool Success, string Message)> DeleteUserAsync(int userId);
        Task<(bool Success, string Message)> SuspendUserAsync(int userId);
        Task<(bool Success, string Message)> ActivateUserAsync(int userId);
    }
}
