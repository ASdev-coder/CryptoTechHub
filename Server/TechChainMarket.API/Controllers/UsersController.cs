using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechChainMarket.API.DTOs;
using TechChainMarket.Core.Interfaces;
using TechChainMarket.Infrastructure.Data;

namespace TechChainMarket.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileService;

    public UsersController(AppDbContext context, IFileStorageService fileService)
    {
        _context = context;
        _fileService = fileService;
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromForm] UserProfileUpdateDto request)
    {
        var walletAddress = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(walletAddress))
            return Unauthorized("Wallet address not found in token");
        
        var user = await _context.Users.FirstOrDefaultAsync(u => u.WalletAddress == walletAddress);
        if (user == null)
            return NotFound("User not found");
        
        if (!string.IsNullOrWhiteSpace(request.UserName))
            user.Username = request.UserName;

        if (!string.IsNullOrWhiteSpace(request.Bio))
            user.Bio = request.Bio;
        
        if (request.ProfileImage != null && request.ProfileImage.Length > 0)
        {
            using var stream = request.ProfileImage.OpenReadStream();
            var imageUrl = await _fileService.UploadFileAsync(
                stream, 
                request.ProfileImage.FileName, 
                request.ProfileImage.ContentType
            );
            user.ProfileImageUrl = imageUrl;
        }

        await _context.SaveChangesAsync();

        return Ok(new 
        { 
            user.Username, 
            user.Bio, 
            user.ProfileImageUrl,
            isBlocked = user.IsBlocked
        });
    }
    
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var walletAddress = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(walletAddress))
            return Unauthorized("Wallet address not found in token");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.WalletAddress == walletAddress);
    
        if (user == null)
            return NotFound("User not found");

        return Ok(new 
        { 
            user.Username, 
            user.Bio, 
            user.ProfileImageUrl,
            isBlocked = user.IsBlocked
        });
    }
    
    [HttpGet]
    [Authorize(Roles = "Admin,SuperAdmin,Owner")]
    public async Task<IActionResult> GetUsers()
    {
        var currentUserWallet = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var users = await _context.Users
            .Where(u => u.WalletAddress != currentUserWallet)
            .ToListAsync();

        return Ok(users);
    }
}