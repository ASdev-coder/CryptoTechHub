using Nethereum.ABI.FunctionEncoding.Attributes;

namespace TechChainMarket.Core.Events;

[Event("AdminAdded")]
public class AdminAddedEventDTO : IEventDTO
{
    [Parameter("address", "_admin", 1, true)]
    public string AdminAddress { get; set; }
}