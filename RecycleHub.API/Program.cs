using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using RecycleHub.API.Common.Constants;
using RecycleHub.API.Common.Enums;
using RecycleHub.API.Common.Settings;
using RecycleHub.API.Data;
using RecycleHub.API.Helpers;
using RecycleHub.API.Hubs;
using RecycleHub.API.Middleware;
using RecycleHub.API.Models;
using RecycleHub.API.Services;
using RecycleHub.API.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// ════════════════════════════════════════════════════════════════════════════
// 1. DATABASE
// ════════════════════════════════════════════════════════════════════════════
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Database connection string 'DefaultConnection' is not configured.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        connectionString,
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null);
            sqlOptions.CommandTimeout(30);
        })
    .EnableSensitiveDataLogging(builder.Environment.IsDevelopment()));

// ════════════════════════════════════════════════════════════════════════════
// 2. JWT SETTINGS
// ════════════════════════════════════════════════════════════════════════════
var jwtSection = builder.Configuration.GetSection("JwtSettings");
builder.Services.Configure<JwtSettings>(jwtSection);
builder.Services.Configure<PawaPaySettings>(builder.Configuration.GetSection(PawaPaySettings.SectionName));
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection(EmailSettings.SectionName));
var jwtSettings = jwtSection.Get<JwtSettings>()
    ?? throw new InvalidOperationException("JwtSettings section is missing from appsettings.json.");

builder.Services.AddSingleton(jwtSettings);
builder.Services.AddScoped<JwtTokenGenerator>();

// ════════════════════════════════════════════════════════════════════════════
// 3. AUTHENTICATION (JWT Bearer)
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = true,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = jwtSettings.Issuer,
        ValidAudience            = jwtSettings.Audience,
        IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
        ClockSkew                = TimeSpan.Zero
    };

    // Allow JWT via query string for SignalR WebSocket connections
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) &&
                (path.StartsWithSegments("/notificationhub") || path.StartsWithSegments("/hubs/notifications")))
                context.Token = accessToken;
            return Task.CompletedTask;
        }
    };
});

// ════════════════════════════════════════════════════════════════════════════
// 4. AUTHORIZATION POLICIES
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AppConstants.PolicyAdminOnly,    p => p.RequireRole(AppConstants.RoleAdmin));
    options.AddPolicy(AppConstants.PolicyBuyerOnly,    p => p.RequireRole(AppConstants.RoleBuyer));
    options.AddPolicy(AppConstants.PolicySellerOnly,   p => p.RequireRole(AppConstants.RoleSeller));
    options.AddPolicy(AppConstants.PolicyAdminOrSeller,p => p.RequireRole(AppConstants.RoleAdmin, AppConstants.RoleSeller));
});

// ════════════════════════════════════════════════════════════════════════════
// 5. CONTROLLERS
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy        = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.ReferenceHandler            = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition      = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// ════════════════════════════════════════════════════════════════════════════
// 6. CORS (single policy: AllowFrontend — also used by UseCors / SignalR)
// ════════════════════════════════════════════════════════════════════════════
var corsSection = builder.Configuration.GetSection("Cors:AllowedOrigins");
var corsOriginSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
foreach (var v in corsSection.GetChildren()
             .Select(c => c.Value)
             .Where(v => !string.IsNullOrWhiteSpace(v)))
    corsOriginSet.Add(v!);
if (corsSection.Get<string[]>() is { Length: > 0 } fromJson)
{
    foreach (var v in fromJson)
        if (!string.IsNullOrWhiteSpace(v))
            corsOriginSet.Add(v);
}
if (corsOriginSet.Count == 0)
{
    foreach (var v in new[]
             {
                 "http://localhost:3000", "http://localhost:5173", "http://localhost:5174",
                 "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5500", "http://localhost:5500"
             })
        corsOriginSet.Add(v);
}
string[] corsOrigins = corsOriginSet.ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy
            .WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .SetPreflightMaxAge(TimeSpan.FromSeconds(3600)));
});

// ════════════════════════════════════════════════════════════════════════════
// 7. SIGNALR
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
});

// ════════════════════════════════════════════════════════════════════════════
// 8. SWAGGER / OPENAPI
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title       = "RecycleHub API",
        Version     = "v1",
        Description = "B2B Recyclable Materials Marketplace API — JWT Auth + SignalR + MoMo Payments",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name  = "RecycleHub Team",
            Email = "support@recyclehub.com"
        }
    });

    // JWT Bearer auth in Swagger UI
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Format: 'Bearer {token}'",
        Name        = "Authorization",
        In          = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type        = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme      = "Bearer"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ════════════════════════════════════════════════════════════════════════════
// 9. APPLICATION SERVICES (Dependency Injection)
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddScoped<IEmailSender,           SmtpEmailSender>();
builder.Services.AddScoped<IAuthService,           AuthService>();
builder.Services.AddScoped<IUserService,           UserService>();
builder.Services.AddScoped<IBuyerProfileService,   BuyerProfileService>();
builder.Services.AddScoped<ISellerProfileService,  SellerProfileService>();
builder.Services.AddScoped<IMaterialService,       MaterialService>();
builder.Services.AddScoped<IMaterialImageService,  MaterialImageService>();
builder.Services.AddScoped<IAIAnalysisResultService, AIAnalysisResultService>();
builder.Services.AddScoped<IOrderService,          OrderService>();
builder.Services.AddHttpClient<IPawaPayDepositClient, PawaPayDepositClient>((sp, client) =>
{
    var opt = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<PawaPaySettings>>().Value;
    client.BaseAddress = new Uri(opt.ResolveBaseUrl() + "/");
    client.Timeout = TimeSpan.FromSeconds(60);
});
builder.Services.AddScoped<IPaymentService,        PaymentService>();
builder.Services.AddScoped<IMessageService,        MessageService>();
builder.Services.AddScoped<INotificationService,   NotificationService>();
builder.Services.AddScoped<ICertificateRequestService, CertificateRequestService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IReviewService,         ReviewService>();
builder.Services.AddScoped<ISmartSwapMatchService, SmartSwapMatchService>();

// ════════════════════════════════════════════════════════════════════════════
// 10. BUILD THE APP
// ════════════════════════════════════════════════════════════════════════════
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    var corsLog = app.Services.GetRequiredService<ILogger<Program>>();
    corsLog.LogInformation("Cors:AllowedOrigins — using {Count} value(s): {List}", corsOrigins.Length, string.Join(", ", corsOrigins));
}

// ── Database connectivity + default admin seed (idempotent) ───────────
const string DefaultAdminEmail  = "admin@recyclehub.com";
const string DefaultAdminUserName = "admin";
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        if (!await context.Database.CanConnectAsync())
        {
            logger.LogWarning("Cannot connect to RecycleHub database — check connection string and that RecycleHubDB exists.");
        }
        else
        {
            logger.LogInformation("RecycleHub database connection OK.");

            if (!await context.Users.AnyAsync(u => u.Role == UserRole.Admin))
            {
                if (await context.Users.AnyAsync(u => u.Email == DefaultAdminEmail))
                {
                    logger.LogWarning(
                        "No Admin role user found, but email {Email} is already taken. Skipping default admin seed.",
                        DefaultAdminEmail);
                }
                else if (await context.Users.AnyAsync(u => u.Username == DefaultAdminUserName))
                {
                    logger.LogWarning(
                        "No Admin role user found, but username {Username} is already taken. Skipping default admin seed.",
                        DefaultAdminUserName);
                }
                else
                {
                    var admin = new User
                    {
                        Username  = DefaultAdminUserName,
                        FirstName = "System",
                        LastName  = "Admin",
                        Email     = DefaultAdminEmail,
                        Gender    = Gender.Male,
                        Role      = UserRole.Admin,
                        Status    = UserStatus.Active,
                        PasswordHash = PasswordHasher.Hash("Admin@123"),
                        CreatedAt = DateTime.UtcNow
                    };
                    context.Users.Add(admin);
                    await context.SaveChangesAsync();
                    logger.LogInformation("Seeded default admin user ({Email}). Change the password in production.", DefaultAdminEmail);
                }
            }
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database startup error: {Message}", ex.Message);
    }
}

// ════════════════════════════════════════════════════════════════════════════
// 11. HTTP REQUEST PIPELINE
// ════════════════════════════════════════════════════════════════════════════

// Global error handler — must be first
app.UseErrorHandling();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "RecycleHub API v1");
        c.RoutePrefix = "swagger"; // Swagger at /swagger
        c.DisplayRequestDuration();
    });
}

app.UseRouting();
app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

// Serve static files (uploaded material images, profile photos)
var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads");
Directory.CreateDirectory(uploadsPath);
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>(AppConstants.NotificationHubPath);
app.MapHub<NotificationHub>("/hubs/notifications");

// Health-check endpoint
app.MapGet("/health", () => new
{
    status    = "healthy",
    service   = "RecycleHub API",
    version   = "v1.0",
    timestamp = DateTime.UtcNow
});

app.Run();
