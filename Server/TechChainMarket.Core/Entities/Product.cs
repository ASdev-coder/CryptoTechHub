namespace TechChainMarket.Core.Entities;

public class Product
{
    public int Id { get; set; }    
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string? Category { get; set; }
    public decimal PriceWei { get; set; } 
    public bool IsActive { get; set; } = true;
}