using Nethereum.ABI.FunctionEncoding.Attributes;

namespace TechChainMarket.Core.Events;

[Event("UserBlocked")]
public class UserBlockedEventDTO : IEventDTO
{
    [Parameter("address", "user", 1, true)]
    public string User { get; set; } = string.Empty;
}

[Event("UserUnblocked")]
public class UserUnblockedEventDTO : IEventDTO
{
    [Parameter("address", "user", 1, true)]
    public string User { get; set; } = string.Empty;
}