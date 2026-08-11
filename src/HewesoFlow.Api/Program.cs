using System.Text;
using HewesoFlow.Application.Common.Settings;
using HewesoFlow.Domain.Entities;
using HewesoFlow.Infrastructure.DependencyInjection;
using HewesoFlow.Persistence.Contexts;
using HewesoFlow.Persistence.DependencyInjection;
using HewesoFlow.Persistence.Seed;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "HewesoFlow API",
            Version = "v1",
            Description =
                "HewesoFlow proje ve görev yönetim sistemi API dokümantasyonu"
        });

    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description =
                "JWT token giriniz. Yalnızca token değerini yapıştırmanız yeterlidir."
        });

    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference =
                        new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                },
                Array.Empty<string>()
            }
        });
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "FrontendPolicy",
        policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:3000",
                    "http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});

// JWT Settings
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection(
        JwtSettings.SectionName));

var jwtSettings =
    builder.Configuration
        .GetSection(
            JwtSettings.SectionName)
        .Get<JwtSettings>();

if (jwtSettings is null)
{
    throw new InvalidOperationException(
        "JwtSettings ayarları bulunamadı.");
}

if (string.IsNullOrWhiteSpace(
        jwtSettings.SecretKey))
{
    throw new InvalidOperationException(
        "JWT SecretKey değeri boş bırakılamaz.");
}

if (jwtSettings.SecretKey.Length < 32)
{
    throw new InvalidOperationException(
        "JWT SecretKey en az 32 karakter olmalıdır.");
}

if (string.IsNullOrWhiteSpace(
        jwtSettings.Issuer))
{
    throw new InvalidOperationException(
        "JWT Issuer değeri boş bırakılamaz.");
}

if (string.IsNullOrWhiteSpace(
        jwtSettings.Audience))
{
    throw new InvalidOperationException(
        "JWT Audience değeri boş bırakılamaz.");
}

if (jwtSettings.ExpirationMinutes <= 0)
{
    throw new InvalidOperationException(
        "JWT geçerlilik süresi sıfırdan büyük olmalıdır.");
}

var secretKey =
    Encoding.UTF8.GetBytes(
        jwtSettings.SecretKey);

// Authentication
builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultChallengeScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultScheme =
            JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata =
            !builder.Environment.IsDevelopment();

        options.SaveToken = false;

        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtSettings.Issuer,

                ValidateAudience = true,
                ValidAudience = jwtSettings.Audience,

                ValidateIssuerSigningKey = true,
                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        secretKey),

                ValidateLifetime = true,
                RequireExpirationTime = true,

                ClockSkew = TimeSpan.Zero
            };
    });

// Authorization
builder.Services.AddAuthorization();

// Persistence
builder.Services.AddPersistence(
    builder.Configuration);

// Infrastructure
builder.Services.AddInfrastructure();

var app = builder.Build();

// Seed
using (var scope =
       app.Services.CreateScope())
{
    var dbContext =
        scope.ServiceProvider
            .GetRequiredService<AppDbContext>();

    var passwordHasher =
        scope.ServiceProvider
            .GetRequiredService<
                IPasswordHasher<User>>();

    await RoleSeeder.SeedAsync(
        dbContext);

    await AdminSeeder.SeedAsync(
        dbContext,
        passwordHasher);
}

// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint(
            "/swagger/v1/swagger.json",
            "HewesoFlow API v1");

        options.RoutePrefix =
            "swagger";
    });
}

// HTTPS
app.UseHttpsRedirection();

// CORS
app.UseCors(
    "FrontendPolicy");

// Authentication
app.UseAuthentication();

// Authorization
app.UseAuthorization();

// Controllers
app.MapControllers();

app.Run();