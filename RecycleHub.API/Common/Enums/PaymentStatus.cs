namespace RecycleHub.API.Common.Enums
{
    /// <summary>SQL CHECK: PaymentStatus IN ('Pending','Requested','Successful','Failed','Cancelled','Expired')</summary>
    public enum PaymentStatus
    {
        Pending,
        Requested,
        Successful,
        Failed,
        Cancelled,
        Expired
    }
}
