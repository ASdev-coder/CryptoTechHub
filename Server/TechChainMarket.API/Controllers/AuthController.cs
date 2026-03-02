using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TechChainMarket.Core.Entities;
using TechChainMarket.Infrastructure.Data;
using TechChainMarket.Infrastructure.Services;

namespace TechChainMarket.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly AuthService _authService;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext context, AuthService authService, IConfiguration config)
    {
        _context = context;
        _authService = authService;
        _config = config;
    }
    
    [HttpGet("nonce/{walletAddress}")]
    public async Task<IActionResult> GetNonce(string walletAddress)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.WalletAddress == walletAddress);

        if (user == null)
        {
            user = new User { WalletAddress = walletAddress };
            _context.Users.Add(user);
        }

        user.Nonce = _authService.GenerateNonce();
        await _context.SaveChangesAsync();

        return Ok(new { nonce = user.Nonce });
    }
    
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.WalletAddress == request.WalletAddress);
        
        if (user == null || user.Nonce == null) return BadRequest("Nonce not found");
        
        var isValid = _authService.VerifySignature(request.WalletAddress, user.Nonce, request.Signature);

        if (!isValid)
        {
            return Unauthorized("Invalid signature");
        }
        
        user.Nonce = null;
        await _context.SaveChangesAsync();
        
        var token = GenerateJwtToken(user);
        return Ok(new { token });
    }

    private string GenerateJwtToken(User user)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.WalletAddress),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("id", user.Id.ToString())
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