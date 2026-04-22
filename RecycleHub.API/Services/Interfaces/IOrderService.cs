using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.OrderDtos;

namespace RecycleHub.API.Services.Interfaces
{
    public interface IOrderService
    {
        Task<PagedResult<OrderResponseDto>> GetAllOrdersAsync(OrderFilterDto filter);
        Task<OrderResponseDto?> GetOrderByIdAsync(int orderId);
        Task<PagedResult<OrderResponseDto>> GetOrdersByBuyerAsync(int buyerUserId, OrderFilterDto filter);
        Task<PagedResult<OrderResponseDto>> GetOrdersBySellerAsync(int sellerUserId, OrderFilterDto filter);
        Task<(bool Success, string Message, OrderResponseDto? Data)> PlaceOrderAsync(int buyerUserId, CreateOrderDto dto);
        Task<(bool Success, string Message)> ConfirmOrderAsync(int orderId);
        Task<(bool Success, string Message)> RejectOrderAsync(int orderId, int sellerUserId, string? note);
        Task<(bool Success, string Message)> ShipOrderAsync(int orderId);
        Task<(bool Success, string Message)> DeliverOrderAsync(int orderId);
        Task<(bool Success, string Message)> CancelOrderAsync(int orderId, string reason, int requesterUserId);
    }
}
