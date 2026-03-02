using Microsoft.AspNetCore.Mvc;
using TechChainMarket.Core.Entities;
using TechChainMarket.Core.Interfaces;
using TechChainMarket.Infrastructure.Data;

namespace TechChainMarket.API.Controllers;

[ApiController]
[Route("api/[controller]")]
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
    public async Task<IActionResult> CreateProduct([FromForm] string title, [FromForm] string description, [FromForm] decimal priceWei, [FromForm] string category, IFormFile image)
    {
        if (image == null || image.Length == 0)
            return BadRequest("Image is required");
        
        using var stream = image.OpenReadStream();
        var imageUrl = await _fileService.UploadFileAsync(stream, image.FileName, image.ContentType);
        
        var product = new Product
        {
            Title = title,
            Description = description,
            PriceWei = priceWei,
            Category = category,
            ImageUrl = imageUrl,
            IsActive = true
        };
        
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return Ok(product);
    }
}