namespace RecycleHub.API.Common.Responses
{
    /// <summary>
    /// Paginated response wrapper that extends ApiResponse with paging metadata.
    /// </summary>
    /// <typeparam name="T">Type of items in the result collection.</typeparam>
    public class PagedResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public IEnumerable<T> Data { get; set; } = Enumerable.Empty<T>();
        public int StatusCode { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        // ── Paging metadata ───────────────────────────────────────────────────
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
        public bool HasPreviousPage => CurrentPage > 1;
        public bool HasNextPage => CurrentPage < TotalPages;

        public static PagedResponse<T> Ok(
            IEnumerable<T> data,
            int currentPage,
            int pageSize,
            int totalCount,
            string message = "Request successful")
        {
            return new PagedResponse<T>
            {
                Success = true,
                Message = message,
                Data = data,
                StatusCode = 200,
                CurrentPage = currentPage,
                PageSize = pageSize,
                TotalCount = totalCount
            };
        }

        public static PagedResponse<T> Fail(string message, int statusCode = 400)
            => new() { Success = false, Message = message, StatusCode = statusCode };
    }
}
