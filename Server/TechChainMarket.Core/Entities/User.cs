using TechChainMarket.Core.Enums;

namespace TechChainMarket.Core.Entities;

public class User
{
    public Guid Id { get; set; }
    public string WalletAddress { get; set; } = string.Empty;
    public string? Username { get; set; }
    public string? Bio { get; set; }
    public string? ProfileImageUrl { get; set; }
    public UserRole Role { get; set; } = UserRole.User;
}