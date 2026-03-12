using Amazon.S3;
using Microsoft.EntityFrameworkCore;
using TechChainMarket.Core.Interfaces;
using TechChainMarket.Infrastructure.Data;
using TechChainMarket.Infrastructure.Services;
using Scalar.AspNetCore;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;

var builder = WebApplication.CreateBuilder(args);

// 1. ПІДКЛЮЧЕННЯ БАЗИ ДАНИХ
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. НАЛАШТУВАННЯ AWS S3
var awsOptions = builder.Configuration.GetAWSOptions("AWS");
awsOptions.Credentials = new Amazon.Runtime.BasicAWSCredentials(
    builder.Configuration["AWS:AccessKey"], 
    builder.Configuration["AWS:SecretKey"]
);
builder.Services.AddDefaultAWSOptions(awsOptions);
builder.Services.AddAWSService<IAmazonS3>();
builder.Services.AddScoped<IFileStorageService, S3StorageService>();

// 3. НАЛАШТУВАННЯ JWT АУТЕНТИФІКАЦІЇ
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };
});

// 4. НАЛАШТУВАННЯ АВТОРИЗАЦІЇ (ВАЖЛИВО: FallbackPolicy має бути null для роботи [AllowAnonymous])
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = null; 
});

// 5. ДОДАТКОВІ СЕРВІСИ
builder.Services.AddScoped<AuthService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// 6. CORS ПОЛІТИКА
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddHostedService<TechChainMarket.Infrastructure.BackgroundServices.BlockchainListenerService>();

var app = builder.Build();

// ПОРЯДОК MIDDLEWARE (НЕ ЗМІНЮВАТИ!)

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// 1. HTTPS
app.UseHttpsRedirection();

// 2. CORS (Має бути перед Routing та Auth)
app.UseCors("AllowReactApp");

// 3. ROUTING
app.UseRouting();

// 4. AUTHENTICATION (Хто ти?)
app.UseAuthentication(); 

// 5. AUTHORIZATION (Що тобі можна?)
app.UseAuthorization();

// 6. КІНЦЕВІ ТОЧКИ
app.MapControllers();

app.Run();