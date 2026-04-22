namespace RecycleHub.API.Services.Interfaces
{
    public interface IPawaPayDepositClient
    {
        /// <summary>POST /v2/deposits — returns initiation status (ACCEPTED, REJECTED, DUPLICATE_IGNORED).</summary>
        Task<(bool Ok, string Message, string? InitStatus)> InitiateDepositAsync(
            Guid depositId,
            decimal amount,
            string currency,
            string phoneNumber,
            string provider,
            CancellationToken cancellationToken = default);

        /// <summary>GET /v2/deposits/{depositId} — returns deposit state (COMPLETED, FAILED, …) when found.</summary>
        Task<(bool Found, string? State, string? FailureMessage)> GetDepositStateAsync(
            Guid depositId,
            CancellationToken cancellationToken = default);
    }
}
