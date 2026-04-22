using System.Text.Json;
using RecycleHub.API.Common.Responses;
using RecycleHub.API.DTOs.PaymentDtos;

namespace RecycleHub.API.Services.Interfaces
{
    public interface IPaymentService
    {
        Task<PagedResult<PaymentResponseDto>> GetAllPaymentsAsync(int pageNumber, int pageSize);
        Task<PaymentResponseDto?> GetPaymentByOrderIdAsync(int orderId);
        Task<PaymentResponseDto?> GetPaymentByIdAsync(int paymentId);
        Task<(bool Success, string Message, PaymentResponseDto? Data)> InitiatePaymentAsync(int buyerUserId, CreatePaymentDto dto);
        Task<(bool Success, string Message)> HandleCallbackAsync(PaymentCallbackDto dto);
        Task<(bool Success, string Message)> HandlePawaPayWebhookAsync(JsonDocument doc);
        Task<(bool Success, string Message)> CheckPaymentStatusAsync(int paymentId);
    }
}
