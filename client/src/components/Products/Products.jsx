import React, { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import { showSuccess, showError } from "../../utils/alerts";

const API_URL = import.meta.env.VITE_API_URL + "/api";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const CONTRACT_ABI = ["function buyProduct(uint256 productId) public payable"];

const Products = ({ role }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buyingId, setBuyingId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("jwt_token");
      const response = await axios.get(`${API_URL}/Products`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      console.log("Отримані товари:", response.data);
      setProducts(response.data);
    } catch (err) {
      console.error(err);
      setError("Не вдалося завантажити товари");
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (product) => {
    try {
      setBuyingId(product.id);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer,
      );

      const tx = await contract.buyProduct(product.id, {
        value: BigInt(product.priceWei),
      });

      console.log("Транзакція відправлена:", tx.hash);

      await tx.wait();

      showSuccess("Транзакція успішно завершена");

      fetchProducts();
    } catch (err) {
      console.error("Помилка при покупці товару:", err);
      showError("Помилка при покупці товару", err.message);
    } finally {
      setBuyingId(null);
    }
  };

  if (loading)
    return <div className="loading-state">⏳ Завантаження товарів...</div>;
  if (error) return <div className="error-state">❌ {error}</div>;

  const displayProducts =
    role === "Admin" ? products : products.filter((p) => p.isActive);

  return (
    <div className="glass-panel products-container">
      <div className="panel-header">
        <h2>
          {role === "Admin" ? "📦 Управління товарами" : "🛒 Вітрина техніки"}
        </h2>

        {role === "Admin" && (
          <button className="btn-primary">+ Додати товар</button>
        )}
      </div>

      {displayProducts.length === 0 ? (
        <p className="empty-state">Товарів поки немає.</p>
      ) : (
        <>
          {role === "Admin" ? (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Фото</th>
                    <th>Назва</th>
                    <th>Категорія</th>
                    <th>Ціна (ETH)</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {displayProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="table-img-wrapper">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.title} />
                          ) : (
                            <div className="no-img-mini">Немає</div>
                          )}
                        </div>
                      </td>
                      <td className="fw-bold">{product.title}</td>
                      <td>
                        <span className="category-tag">{product.category}</span>
                      </td>
                      <td className="eth-price">{product.priceWei}</td>
                      <td>
                        <span
                          className={`status-badge ${product.isActive ? "active" : "inactive"}`}
                        >
                          {product.isActive ? "Активний" : "Знято"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="products-grid">
              {displayProducts.map((product) => (
                <div className="product-card-user" key={product.id}>
                  <div className="product-image-box">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.title} />
                    ) : (
                      <div className="no-img-placeholder">ФОТО ВІДСУТНЄ</div>
                    )}
                    <span className="product-category-badge">
                      {product.category}
                    </span>
                  </div>

                  <div className="product-info-box">
                    <h3 className="product-title">{product.title}</h3>
                    <p className="product-desc">
                      {product.description?.length > 60
                        ? `${product.description.substring(0, 60)}...`
                        : product.description || "Опис відсутній"}
                    </p>

                    <div className="product-buy-section">
                      <div className="price-tag">
                        <span className="eth-symbol">Ξ</span> {product.priceWei}
                      </div>
                      <button
                        className="btn-primary buy-btn"
                        onClick={() => handleBuy(product)}
                        disabled={buyingId === product.id}
                      >
                        {buyingId === product.id ? "⏳..." : "Купити"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Products;
