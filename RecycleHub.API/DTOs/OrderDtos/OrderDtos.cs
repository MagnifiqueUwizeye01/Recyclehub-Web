using RecycleHub.API.Common.Enums;

namespace RecycleHub.API.DTOs.OrderDtos
{
    public class CreateOrderDto
    {
        public int MaterialId { get; set; }
        public decimal QuantityOrdered { get; set; }
        public decimal OfferedUnitPrice { get; set; }
        public string Currency { get; set; } = "RWF";
        public string? BuyerNote { get; set; }
        public string? ShippingAddress { get; set; }
    }

    public class UpdateOrderStatusDto
    {
        public OrderStatus Status { get; set; }
        public string? SellerNote { get; set; }
        public DateTime? ExpectedDeliveryAt { get; set; }
        public string? CancelReason { get; set; }
    }

    public class OrderResponseDto
    {
        public int OrderId { get; set; }
        public int BuyerUserId { get; set; }
        public string BuyerUsername { get; set; } = string.Empty;
        public string BuyerFullName { get; set; } = string.Empty;
        public string BuyerEmail { get; set; } = string.Empty;
        public int SellerUserId { get; set; }
        public string SellerUsername { get; set; } = string.Empty;
        public string SellerCompanyName { get; set; } = string.Empty;
        public int MaterialId { get; set; }
        public string MaterialTitle { get; set; } = string.Empty;
        public string MaterialType { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public decimal QuantityOrdered { get; set; }
        public decimal OfferedUnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public OrderStatus Status { get; set; }
        public string? BuyerNote { get; set; }
        public string? SellerNote { get; set; }
        public string? ShippingAddress { get; set; }
        public DateTime? ExpectedDeliveryAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public DateTime? CancelledAt { get; set; }
        public string? CancelReason { get; set; }
        public DateTime OrderDate { get; set; }
        public bool HasPayment { get; set; }
        public string? PaymentStatus { get; set; }
    }

    public class OrderFilterDto
    {
        public OrderStatus? Status { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
