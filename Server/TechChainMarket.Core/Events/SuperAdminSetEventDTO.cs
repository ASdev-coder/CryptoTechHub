using Nethereum.ABI.FunctionEncoding.Attributes;

namespace TechChainMarket.Core.Events;

[Event("SuperAdminSet")]
public class SuperAdminSetEventDTO : IEventDTO
{
    [Parameter("address", "oldAdmin", 1, true)]
    public string OldAdmin { get; set; }

    [Parameter("address", "newAdmin", 2, true)]
    public string NewAdmin { get; set; }
}