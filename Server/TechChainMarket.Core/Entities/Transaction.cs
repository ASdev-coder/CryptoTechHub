namespace TechChainMarket.Core.Entities;

public class Transaction
{
    public Guid Id { get; set; }
    public string TransactionHash { get; set; } = string.Empty;
    public string BuyerAddress { get; set; } = string.Empty;
    public int ProductId { get; set; }
    public Product? Product { get; set; } 
    public decimal AmountWei { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}