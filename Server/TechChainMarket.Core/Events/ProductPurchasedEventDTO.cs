using Nethereum.ABI.FunctionEncoding.Attributes;

namespace TechChainMarket.Core.Events;

[Event("ProductPurchased")]
public class ProductPurchasedEventDTO : IEventDTO
{
    [Parameter("uint256", "_productId", 1, true)]
    public int ProductId { get; set; }

    [Parameter("address", "_buyer", 2, true)]
    public string Buyer { get; set; }

    [Parameter("uint256", "_price", 3, false)]
    public long Price { get; set; }
}