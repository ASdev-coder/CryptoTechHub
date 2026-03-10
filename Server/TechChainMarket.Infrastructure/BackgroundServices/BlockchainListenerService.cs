using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Nethereum.Web3;
using TechChainMarket.Core.Enums;
using TechChainMarket.Core.Events;
using TechChainMarket.Infrastructure.Data;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

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
                    var adminRemovedHandler = _web3.Eth.GetEvent<AdminRemovedEventDTO>(contractAddress);
                    var superAdminHandler = _web3.Eth.GetEvent<SuperAdminSetEventDTO>(contractAddress);
                    var userBlockedHandler = _web3.Eth.GetEvent<UserBlockedEventDTO>(contractAddress);
                    var userUnblockedHandler = _web3.Eth.GetEvent<UserUnblockedEventDTO>(contractAddress);
                    
                    var filterFromBlock = new Nethereum.RPC.Eth.DTOs.BlockParameter(
                        new Nethereum.Hex.HexTypes.HexBigInteger(lastBlockChecked.Value + 1)
                    );
                    var filterToBlock = new Nethereum.RPC.Eth.DTOs.BlockParameter(currentBlock);
                    
                    var purchaseFilter = purchaseEventHandler.CreateFilterInput(filterFromBlock, filterToBlock);
                    var adminAddedFilter = adminAddedHandler.CreateFilterInput(filterFromBlock, filterToBlock);
                    var adminRemovedFilter = adminRemovedHandler.CreateFilterInput(filterFromBlock, filterToBlock);
                    var superAdminFilter = superAdminHandler.CreateFilterInput(filterFromBlock, filterToBlock);
                    var blockedFilter = userBlockedHandler.CreateFilterInput(filterFromBlock, filterToBlock);
                    var unblockedFilter = userUnblockedHandler.CreateFilterInput(filterFromBlock, filterToBlock);
                    
                    var purchaseLogs = await purchaseEventHandler.GetAllChangesAsync(purchaseFilter);
                    var adminAddedLogs = await adminAddedHandler.GetAllChangesAsync(adminAddedFilter);
                    var adminRemovedLogs = await adminRemovedHandler.GetAllChangesAsync(adminRemovedFilter);
                    var superAdminLogs = await superAdminHandler.GetAllChangesAsync(superAdminFilter);
                    var blockedLogs = await userBlockedHandler.GetAllChangesAsync(blockedFilter);
                    var unblockedLogs = await userUnblockedHandler.GetAllChangesAsync(unblockedFilter);
                    
                    if (purchaseLogs.Any() || adminAddedLogs.Any() || adminRemovedLogs.Any() || 
                        superAdminLogs.Any() || blockedLogs.Any() || unblockedLogs.Any())
                    {
                        using var scope = _serviceProvider.CreateScope();
                        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                        
                        foreach (var log in purchaseLogs)
                        {
                            var productId = (int)log.Event.ProductId; 
                            var product = await dbContext.Products.FindAsync(productId);
                            
                            if (product != null && product.IsActive)
                            {
                                product.IsActive = false;

                                dbContext.Products.Update(product);
                                _logger.LogInformation($"[PURCHASE] Product {productId} bought by {log.Event.Buyer}");
                            }
                        }
                        
                        foreach (var log in adminAddedLogs)
                        {
                            var newAdminWallet = log.Event.AdminAddress;
                            var user = await dbContext.Users.FirstOrDefaultAsync(u => 
                                u.WalletAddress.ToLower() == newAdminWallet.ToLower());

                            if (user != null)
                            {
                                user.Role = UserRole.Admin; 
                                dbContext.Users.Update(user);
                                _logger.LogInformation($"[ROLE UPDATE] User {newAdminWallet} is now ADMIN!");
                            }
                        }
                        
                        foreach (var log in adminRemovedLogs)
                        {
                            var removedAdminWallet = log.Event.AdminAddress;
                            var user = await dbContext.Users.FirstOrDefaultAsync(u => 
                                u.WalletAddress.ToLower() == removedAdminWallet.ToLower());

                            if (user != null)
                            {
                                user.Role = UserRole.User; 
                                dbContext.Users.Update(user);
                                _logger.LogInformation($"[ROLE UPDATE] User {removedAdminWallet} was REMOVED from admins.");
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
                                dbContext.Users.Update(user);
                                _logger.LogInformation($"[ROLE UPDATE] User {newSuperAdminWallet} is now SUPER ADMIN!");
                            }
                        }
                        
                        foreach (var log in blockedLogs)
                        {
                            var blockedWallet = log.Event.User;
                            var user = await dbContext.Users.FirstOrDefaultAsync(u => 
                                u.WalletAddress.ToLower() == blockedWallet.ToLower());

                            if (user != null && !user.IsBlocked)
                            {
                                user.IsBlocked = true;
                                dbContext.Users.Update(user);
                                _logger.LogInformation($"[DB-SUCCESS] User {blockedWallet} blocked.");
                            }
                        }

                        foreach (var log in unblockedLogs)
                        {
                            var unblockedWallet = log.Event.User;
                            var user = await dbContext.Users.FirstOrDefaultAsync(u => 
                                u.WalletAddress.ToLower() == unblockedWallet.ToLower());

                            if (user != null && user.IsBlocked)
                            {
                                user.IsBlocked = false;
                                dbContext.Users.Update(user);
                                _logger.LogInformation($"[DB-SUCCESS] User {unblockedWallet} unblocked.");
                            }
                        }

                        try 
                        {
                            var savedCount = await dbContext.SaveChangesAsync();
                            if (savedCount > 0) 
                            {
                                _logger.LogInformation($"[DB] Успішно збережено змін у базі: {savedCount}");
                            }
                        }
                        catch (Exception dbEx)
                        {
                            _logger.LogError($"[CRITICAL] Помилка збереження в БД: {dbEx.Message}");
                        }
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