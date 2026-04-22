namespace RecycleHub.API.Common.Enums
{
    /// <summary>Stored as string in SQL. AwaitingPayment = reserved until MoMo payment completes.</summary>
    public enum OrderStatus
    {
        AwaitingPayment,
        Pending,
        Accepted,
        Rejected,
        Paid,
        Shipped,
        Delivered,
        Cancelled
    }
}
