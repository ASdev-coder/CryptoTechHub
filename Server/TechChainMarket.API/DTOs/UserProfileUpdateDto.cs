using Microsoft.AspNetCore.Http;

namespace TechChainMarket.API.DTOs;

public record UserProfileUpdateDto(
    string? UserName,
    string? Bio,
    IFormFile? ProfileImage
);