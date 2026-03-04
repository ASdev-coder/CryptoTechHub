using Amazon.S3;
using Microsoft.EntityFrameworkCore;
using TechChainMarket.Core.Interfaces;
using TechChainMarket.Infrastructure.Data;
using TechChainMarket.Infrastructure.Services;
using Scalar.AspNetCore;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var awsOptions = builder.Configuration.GetAWSOptions("AWS");
awsOptions.Credentials = new Amazon.Runtime.BasicAWSCredentials(
    builder.Configuration["AWS:AccessKey"], 
    builder.Configuration["AWS:SecretKey"]
);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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

builder.Services.AddAuthorization();

builder.Services.AddDefaultAWSOptions(awsOptions);
builder.Services.AddScoped<AuthService>();
builder.Services.AddAWSService<IAmazonS3>();

builder.Services.AddScoped<IFileStorageService, S3StorageService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

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

app.UseCors("AllowReactApp");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.MapControllers();

app.Run();