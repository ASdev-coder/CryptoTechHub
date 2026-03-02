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

            var recoveredAddress = signer.EncodeUTF8AndEcRecover(nonce, signature);
            
            return string.Equals(recoveredAddress, walletAddress, StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }
}