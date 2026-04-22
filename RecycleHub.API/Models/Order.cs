using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.Models
{
    /// <summary>Maps to dbo.Orders — BuyerUserId AND SellerUserId direct FKs to Users.</summary>
    public class Order
    {
        public int OrderId { get; set; }
        public int BuyerUserId { get; set; }
        public int SellerUserId { get; set; }
        public int MaterialId { get; set; }
        public decimal QuantityOrdered { get; set; }
        public decimal OfferedUnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public string Currency { get; set; } = "RWF";
        public OrderStatus Status { get; set; } = OrderStatus.Pending;
        public string? BuyerNote { get; set; }
        public string? SellerNote { get; set; }
        public string? ShippingAddress { get; set; }
        public DateTime? ExpectedDeliveryAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public DateTime? CancelledAt { get; set; }
        public string? CancelReason { get; set; }
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // ── Navigation ────────────────────────────────────────────────────────
        public User BuyerUser { get; set; } = null!;
        public User SellerUser { get; set; } = null!;
        public Material Material { get; set; } = null!;
        public Payment? Payment { get; set; }
        public Review? Review { get; set; }
    }
}
