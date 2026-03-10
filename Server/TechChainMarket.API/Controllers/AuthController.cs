using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Nethereum.Web3;
using TechChainMarket.Core.Entities;
using TechChainMarket.Core.Enums;
using TechChainMarket.Infrastructure.Data;
using TechChainMarket.Infrastructure.Services;

namespace TechChainMarket.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous] 
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly AuthService _authService;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        AppDbContext context, 
        AuthService authService, 
        IConfiguration config, 
        ILogger<AuthController> logger)
    {
        _context = context;
        _authService = authService;
        _config = config;
        _logger = logger;
    }

    [HttpGet("nonce/{walletAddress}")]
    public async Task<IActionResult> GetNonce(string walletAddress)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.WalletAddress == walletAddress);
        
        if (user == null)
        {
            user = new User 
            { 
                Id = Guid.NewGuid(),
                WalletAddress = walletAddress, 
                IsBlocked = false,
                Role = UserRole.User
            };
            _context.Users.Add(user);
        }

        user.Nonce = _authService.GenerateNonce();
        await _context.SaveChangesAsync();

        return Ok(new { nonce = user.Nonce });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try 
        {
            _logger.LogInformation($"[AUTH] Спроба входу: {request.WalletAddress}");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.WalletAddress == request.WalletAddress);
            if (user == null) return NotFound("User not found");
            
            var isValid = _authService.VerifySignature(request.WalletAddress, user.Nonce, request.Signature);
            
            if (!isValid) 
            {
                _logger.LogWarning($"[AUTH] Невірний підпис для {request.WalletAddress}");
                return Unauthorized("Invalid signature");
            }

            if (user.IsBlocked)
            {
                _logger.LogWarning($"[AUTH] Користувач заблокований: {request.WalletAddress}");
                return StatusCode(403, new { message = "Ваш обліковий запис було заблоковано." });
            }

            user.Nonce = null;
            
            await SyncWeb3Roles(user);

            await _context.SaveChangesAsync();
            
            var token = GenerateJwtToken(user);
            _logger.LogInformation($"[AUTH] Успішний вхід: {request.WalletAddress}");
            return Ok(new { token });
        }
        catch (Exception ex)
        {
            _logger.LogError($"[AUTH-ERROR] {ex.Message}");
            return StatusCode(500, "Внутрішня помилка сервера");
        }
    }

    private async Task SyncWeb3Roles(User user)
    {
        try
        {
            var rpcUrl = _config["Web3:RpcUrl"];
            var contractAddress = _config["Web3:ContractAddress"];

            if (!string.IsNullOrEmpty(rpcUrl) && !string.IsNullOrEmpty(contractAddress))
            {
                var web3 = new Web3(rpcUrl);
                var abi = "[{\"inputs\":[],\"name\":\"owner\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"superAdmin\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"name\":\"admins\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"}]";
                var contract = web3.Eth.GetContract(abi, contractAddress);
                
                var currentOwner = await contract.GetFunction("owner").CallAsync<string>();
                var currentSuperAdmin = await contract.GetFunction("superAdmin").CallAsync<string>();
                var isAdmin = await contract.GetFunction("admins").CallAsync<bool>(user.WalletAddress);

                if (user.WalletAddress.Equals(currentOwner, StringComparison.OrdinalIgnoreCase)) user.Role = UserRole.Owner;
                else if (user.WalletAddress.Equals(currentSuperAdmin, StringComparison.OrdinalIgnoreCase)) user.Role = UserRole.SuperAdmin;
                else if (isAdmin) user.Role = UserRole.Admin;
                else user.Role = UserRole.User;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"[WEB3-SYNC] {ex.Message}");
        }
    }

    private string GenerateJwtToken(User user)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
        
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.WalletAddress),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("id", user.Id.ToString()),
            new Claim("isBlocked", user.IsBlocked.ToString().ToLower())
        };

        var token = new JwtSecurityToken(
            _config["Jwt:Issuer"],
            _config["Jwt:Audience"],
            claims,
            expires: DateTime.Now.AddDays(1),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public record LoginRequest(string WalletAddress, string Signature);