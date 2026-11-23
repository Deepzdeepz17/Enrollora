
using System.Net;
using System.Text.Json;

namespace Enrollora.Api.Middleware;

public sealed class GlobalExceptionHandler(
    RequestDelegate next,
    ILogger<GlobalExceptionHandler> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unhandled API exception.");

            var (status, title) = exception switch
            {
                KeyNotFoundException => (404, "Resource not found"),
                UnauthorizedAccessException => (401, "Unauthorized"),
                ArgumentException => (400, "Invalid request"),
                InvalidOperationException => (400, "Operation could not be completed"),
                _ => (500, "An unexpected error occurred")
            };

            context.Response.Clear();
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/problem+json";

            var payload = new
            {
                type = "about:blank",
                title,
                status,
                detail = exception.ToString(),
                traceId = context.TraceIdentifier
            };

            await context.Response.WriteAsync(
                JsonSerializer.Serialize(payload));
        }
    }
}
