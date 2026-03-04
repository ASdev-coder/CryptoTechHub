using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Nethereum.Web3;
using TechChainMarket.Core.Enums;
using TechChainMarket.Core.Events;
using TechChainMarket.Infrastructure.Data;


namespace TechChainMarket.Infrastructure.BackgroundServices;

public class BlockchainListenerService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _config;
    private readonly ILogger<BlockchainListenerService> _logger;
    private readonly Web3 _web3;

    public BlockchainListenerService(
        IServiceProvider serviceProvider, 
        IConfiguration config, 
        ILogger<BlockchainListenerService> logger)
    {
        _serviceProvider = serviceProvider;
        _config = config;
        _logger = logger;
        _web3 = new Web3(_config["Web3:RpcUrl"]);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var contractAddress = _config["Web3:ContractAddress"];
        
        if (string.IsNullOrEmpty(contractAddress))
        {
            _logger.LogError("Contract address is not configured in appsettings.json!");
            return;
        }

        _logger.LogInformation($"Starting Blockchain Listener for contract: {contractAddress}");

        var lastBlockChecked = await _web3.Eth.Blocks.GetBlockNumber.SendRequestAsync();

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var currentBlock = await _web3.Eth.Blocks.GetBlockNumber.SendRequestAsync();

                if (currentBlock.Value > lastBlockChecked.Value)
                {
                    var purchaseEventHandler = _web3.Eth.GetEvent<ProductPurchasedEventDTO>(contractAddress);
                    var adminAddedHandler = _web3.Eth.GetEvent<AdminAddedEventDTO>(contractAddress);
                    var superAdminHandler = _web3.Eth.GetEvent<SuperAdminSetEventDTO>(contractAddress);
                    
                    var filterFromBlock = new Nethereum.RPC.Eth.DTOs.BlockParameter(lastBlockChecked);
                    var filterToBlock = new Nethereum.RPC.Eth.DTOs.BlockParameter(currentBlock);

                    var purchaseFilter = purchaseEventHandler.CreateFilterInput(filterFromBlock, filterToBlock);
                    var adminFilter = adminAddedHandler.CreateFilterInput(filterFromBlock, filterToBlock);
                    var superAdminFilter = superAdminHandler.CreateFilterInput(filterFromBlock, filterToBlock);
                    
                    var purchaseLogs = await purchaseEventHandler.GetAllChangesAsync(purchaseFilter);
                    var adminLogs = await adminAddedHandler.GetAllChangesAsync(adminFilter);
                    var superAdminLogs = await superAdminHandler.GetAllChangesAsync(superAdminFilter);
                    
                    if (purchaseLogs.Any() || adminLogs.Any() || superAdminLogs.Any())
                    {
                        using var scope = _serviceProvider.CreateScope();
                        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                        
                        foreach (var log in purchaseLogs)
                        {
                            var productId = log.Event.ProductId;
                            var product = await dbContext.Products.FindAsync(productId);
                            if (product != null && product.IsActive)
                            {
                                product.IsActive = false;
                                _logger.LogInformation($"[PURCHASE] Product {productId} bought by {log.Event.Buyer}");
                            }
                        }
                        
                        foreach (var log in adminLogs)
                        {
                            var newAdminWallet = log.Event.AdminAddress;
                            var user = await dbContext.Users.FirstOrDefaultAsync(u => 
                                u.WalletAddress.ToLower() == newAdminWallet.ToLower());

                            if (user != null)
                            {
                                user.Role = UserRole.Admin;
                                _logger.LogInformation($"[ROLE UPDATE] User {newAdminWallet} is now ADMIN!");
                            }
                        }
                        
                        foreach (var log in superAdminLogs)
                        {
                            var newSuperAdminWallet = log.Event.NewAdmin;
                            var user = await dbContext.Users.FirstOrDefaultAsync(u => 
                                u.WalletAddress.ToLower() == newSuperAdminWallet.ToLower());

                            if (user != null)
                            {
                                user.Role = UserRole.SuperAdmin;
                                _logger.LogInformation($"[ROLE UPDATE] User {newSuperAdminWallet} is now SUPER ADMIN!");
                            }
                        }

                        await dbContext.SaveChangesAsync();
                    }

                    lastBlockChecked = currentBlock;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Blockchain Listener Error: {ex.Message}");
            }
            
            await Task.Delay(2000, stoppingToken);
        }
    }
}