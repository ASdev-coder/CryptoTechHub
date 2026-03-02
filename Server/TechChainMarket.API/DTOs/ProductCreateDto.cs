namespace TechChainMarket.API.DTOs;

public record ProductCreateDto(
    string Title,
    string Description,
    decimal PriceWei,
    string Category,
    IFormFile Image
);