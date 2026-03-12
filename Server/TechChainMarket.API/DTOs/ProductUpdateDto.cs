using Microsoft.AspNetCore.Http;

namespace TechChainMarket.API.DTOs;

public class ProductUpdateDto
{
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string PriceWei { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string? ImageUrl { get; set; }
    public IFormFile? Image { get; set; }
}