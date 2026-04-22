using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.DTOs.PaymentDtos
{
    public class CreatePaymentDto
    {
        public int OrderId { get; set; }
        public string PhoneNumber { get; set; } = string.Empty;
        public string Currency { get; set; } = "RWF";
        public string? RequestMessage { get; set; }

        /// <summary>Ignored for routing: deposits always use MTN MoMo (see <c>DefaultMtnProvider</c>).</summary>
        public string? PaymentChannel { get; set; }
    }

    public class PaymentResponseDto
    {
        public int PaymentId { get; set; }
        public int OrderId { get; set; }
        public int BuyerUserId { get; set; }
        public string BuyerUsername { get; set; } = string.Empty;
        public string MaterialTitle { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = "MobileMoney";
        public PaymentStatus PaymentStatus { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? ExternalReference { get; set; }
        public string? MoMoReferenceId { get; set; }
        public string? FinancialTransactionId { get; set; }
        public string? FailureReason { get; set; }
        public DateTime? RequestedAt { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PaymentCallbackDto
    {
        public string ExternalReference { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public string? MoMoReferenceId { get; set; }
        public string? FinancialTransactionId { get; set; }
        public string? FailureReason { get; set; }
    }
}
