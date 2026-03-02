using Microsoft.EntityFrameworkCore;
using TechChainMarket.Core.Entities;

namespace TechChainMarket.Infrastructure.Data;

public class AppDbContext : DbContext
{


    public DbSet<User> Users { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Transaction> Transactions { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.WalletAddress)
            .IsUnique();

        modelBuilder.Entity<Transaction>()
            .HasIndex(t => t.TransactionHash)
            .IsUnique();

        modelBuilder.Entity<Product>()
            .Property(p => p.PriceWei)
            .HasColumnType("numeric(78,0)");

        modelBuilder.Entity<Transaction>()
            .Property(t => t.AmountWei)
            .HasColumnType("numeric(78,0)");
    }
}