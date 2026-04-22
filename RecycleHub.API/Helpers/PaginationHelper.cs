using RecycleHub.API.Common.Constants;

namespace RecycleHub.API.Helpers
{
    /// <summary>
    /// Utility for applying consistent pagination to IQueryable sources.
    /// </summary>
    public static class PaginationHelper
    {
        /// <summary>
        /// Apply skip/take pagination to a query.
        /// Enforces max page size and minimum page number.
        /// </summary>
        public static IQueryable<T> ApplyPagination<T>(
            IQueryable<T> query,
            int pageNumber,
            int pageSize)
        {
            pageNumber = Math.Max(pageNumber, 1);
            pageSize   = Math.Clamp(pageSize, 1, AppConstants.MaxPageSize);

            return query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize);
        }

        /// <summary>Compute effective page size (clamped to max).</summary>
        public static int GetPageSize(int requested)
            => Math.Clamp(requested, 1, AppConstants.MaxPageSize);
    }
}
