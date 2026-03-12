using Nethereum.Signer;
using TechChainMarket.Core.Entities;

namespace TechChainMarket.Infrastructure.Services;

public class AuthService
{
    public string GenerateNonce() => Guid.NewGuid().ToString();
    
    public bool VerifySignature(string walletAddress, string nonce, string signature)
    {
        try
        {
            var signer = new EthereumMessageSigner();
            
            var message = $"TechChainMarket login: {nonce}";
            
            var recoveredAddress = signer.EncodeUTF8AndEcRecover(message, signature);
            
            return string.Equals(recoveredAddress, walletAddress, StringComparison.OrdinalIgnoreCase);
        }
        catch (Exception)
        {
            return false;
        }
    }
}