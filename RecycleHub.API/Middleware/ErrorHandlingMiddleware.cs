using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace RecycleHub.API.Middleware
{
    public class ErrorHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ErrorHandlingMiddleware> _logger;

        public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
        {
            _next   = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try { await _next(context); }
            catch (Exception ex) { await HandleExceptionAsync(context, ex); }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            int statusCode = ex switch
            {
                UnauthorizedAccessException   => (int)HttpStatusCode.Unauthorized,
                KeyNotFoundException          => (int)HttpStatusCode.NotFound,
                ArgumentException             => (int)HttpStatusCode.BadRequest,
                DbUpdateException             => (int)HttpStatusCode.BadRequest,
                InvalidOperationException     => (int)HttpStatusCode.BadRequest,
                _                             => (int)HttpStatusCode.InternalServerError
            };

            var message = statusCode == 500 ? "An unexpected error occurred." : ex.Message;
            
            // If it's a DB error, try to get the more specific inner message
            if (ex is DbUpdateException dbEx && dbEx.InnerException != null) {
                message = dbEx.InnerException.Message;
            }

            var response = new
            {
                success    = false,
                statusCode,
                message,
                timestamp  = DateTime.UtcNow
            };
            context.Response.ContentType = "application/json";
            context.Response.StatusCode  = statusCode;
            await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
        }
    }

    public static class ErrorHandlingMiddlewareExtensions
    {
        public static IApplicationBuilder UseErrorHandling(this IApplicationBuilder app)
            => app.UseMiddleware<ErrorHandlingMiddleware>();
    }
}
