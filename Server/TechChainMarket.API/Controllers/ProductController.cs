using Microsoft.AspNetCore.Mvc;
using TechChainMarket.Core.Entities;
using TechChainMarket.Core.Interfaces;
using TechChainMarket.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using TechChainMarket.API.DTOs;

namespace TechChainMarket.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileService;

    public ProductsController(AppDbContext context, IFileStorageService fileService)
    {
        _context = context;
        _fileService = fileService;
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateProduct([FromForm] ProductCreateDto dto)
    {
        if (dto.Image == null || dto.Image.Length == 0)
            return BadRequest("Image is required");
        
        using var stream = dto.Image.OpenReadStream();
        var imageUrl = await _fileService.UploadFileAsync(stream, dto.Image.FileName, dto.Image.ContentType);
        
        var product = new Product
        {
            Title = dto.Title,
            Description = dto.Description,
            PriceWei = dto.PriceWei,
            Category = dto.Category,
            ImageUrl = imageUrl,
            IsActive = true
        };
        
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return Ok(product);
    }
}