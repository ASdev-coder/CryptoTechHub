using Microsoft.EntityFrameworkCore;
using TechChainMarket.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// builder.Services.AddCors(options =>
// {
//     options.AddPolicy("ReactCors", policy =>
//     {
//         policy
//             .WithOrigins("http://localhost:3000")
//             .AllowAnyHeader()
//             .AllowAnyMethod();
//     });
// });

builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

// app.UseCors("ReactCors");

app.MapControllers();

app.Run();