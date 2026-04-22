using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.Models
{
    /// <summary>Maps to dbo.Payments — PaymentMethod always 'MobileMoney'.</summary>
    public class Payment
    {
        public int PaymentId { get; set; }
        public int OrderId { get; set; }
        public int BuyerUserId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "MobileMoney";
        public string PhoneNumber { get; set; } = string.Empty;
        public string Currency { get; set; } = "RWF";
        public string? ExternalReference { get; set; }
        public string? MoMoReferenceId { get; set; }
        public string? FinancialTransactionId { get; set; }
        public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
        public string? RequestMessage { get; set; }
        public string? FailureReason { get; set; }
        public DateTime? RequestedAt { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // ── Navigation ────────────────────────────────────────────────────────
        public Order Order { get; set; } = null!;
        public User BuyerUser { get; set; } = null!;
    }
}
