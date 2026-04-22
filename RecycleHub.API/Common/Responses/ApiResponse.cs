namespace RecycleHub.API.Common.Responses
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public int StatusCode { get; set; }
        public List<string>? Errors { get; set; }

        public static ApiResponse<T> Ok(T data, string message = "Success") =>
            new() { Success = true, StatusCode = 200, Message = message, Data = data };

        public static ApiResponse<T> Ok(string message = "Success") =>
            new() { Success = true, StatusCode = 200, Message = message };

        public static ApiResponse<T> Created(T data, string message = "Created successfully") =>
            new() { Success = true, StatusCode = 201, Message = message, Data = data };

        public static ApiResponse<T> Fail(string message, int statusCode = 400, List<string>? errors = null) =>
            new() { Success = false, StatusCode = statusCode, Message = message, Errors = errors };

        public static ApiResponse<T> NotFound(string message = "Resource not found.") =>
            new() { Success = false, StatusCode = 404, Message = message };
    }

    public class PagedResult<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
        public bool HasNextPage => PageNumber < TotalPages;
        public bool HasPreviousPage => PageNumber > 1;
    }
}
