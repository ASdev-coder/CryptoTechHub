using Nethereum.ABI.FunctionEncoding.Attributes;

namespace TechChainMarket.Core.Events;

[Event("AdminRemoved")]
public class AdminRemovedEventDTO : IEventDTO
{
    [Parameter("address", "admin", 1, true)]
    public string AdminAddress { get; set; } = string.Empty;
}