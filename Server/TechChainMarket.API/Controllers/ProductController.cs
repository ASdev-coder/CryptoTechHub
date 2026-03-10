using Microsoft.AspNetCore.Mvc;
using TechChainMarket.Core.Entities;
using TechChainMarket.Core.Interfaces;
using TechChainMarket.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
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
    [AllowAnonymous]
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
    
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllProducts()
    {
        var products = await _context.Products.ToListAsync();
        
        return Ok(products);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromForm] ProductUpdateDto dto)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return NotFound();
        }

        product.Title = dto.Title;
        product.Description = dto.Description;
        product.PriceWei = decimal.Parse(dto.PriceWei);
        product.Category = dto.Category;
        product.IsActive = dto.IsActive;

        if (dto.Image != null && dto.Image.Length > 0)
        {
            using var stream = dto.Image.OpenReadStream();
            product.ImageUrl = await _fileService.UploadFileAsync(stream, dto.Image.FileName, dto.Image.ContentType);
        }
        else if (!string.IsNullOrWhiteSpace(dto.ImageUrl))
        {
            product.ImageUrl = dto.ImageUrl;
        }

        await _context.SaveChangesAsync();
        return Ok(product);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return NotFound();
        }

        try
        {
            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return Ok();
        }
        catch
        {
            product.IsActive = false;
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}