using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using Nethereum.Web3;
using TechChainMarket.Core.Events;
using TechChainMarket.Infrastructure.Data;
using Nethereum.Hex.HexTypes;
using Microsoft.EntityFrameworkCore;

namespace TechChainMarket.Infrastructure.BackgroundServices;

public class BlockchainListenerService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _config;
    private readonly Web3 _web3;

    public BlockchainListenerService(IServiceProvider serviceProvider, IConfiguration config)
    {
        _serviceProvider = serviceProvider;
        _config = config;
        _web3 = new Web3(_config["Web3:RpcUrl"]);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    var contractAddress = _config["Web3:ContractAddress"];

    var lastBlockChecked = await _web3.Eth.Blocks.GetBlockNumber.SendRequestAsync();

    while (!stoppingToken.IsCancellationRequested)
    {
        try
        {
            var currentBlock = await _web3.Eth.Blocks.GetBlockNumber.SendRequestAsync();
            
            if (currentBlock.Value > lastBlockChecked.Value)
            {
                var eventHandler = _web3.Eth.GetEvent<ProductPurchasedEventDTO>(contractAddress);
                
                var filterInput = eventHandler.CreateFilterInput(
                    new Nethereum.RPC.Eth.DTOs.BlockParameter(lastBlockChecked),
                    new Nethereum.RPC.Eth.DTOs.BlockParameter(currentBlock)
                );
                
                var logs = await eventHandler.GetAllChangesAsync(filterInput);

                if (logs.Any())
                {
                    using var scope = _serviceProvider.CreateScope();
                    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                    foreach (var log in logs)
                    {
                        var productId = log.Event.ProductId;
                        var product = await dbContext.Products.FindAsync(productId);
                        if (product != null)
                        {
                            product.IsActive = false;
                        }
                    }
                    await dbContext.SaveChangesAsync();
                }
                
                lastBlockChecked = currentBlock;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Blockchain Error: {ex.Message}");
        }
        
        await Task.Delay(15000, stoppingToken);
    }
}
}