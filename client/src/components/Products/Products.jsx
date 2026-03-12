import React, { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import { showSuccess, showError, confirmDelete } from "../../utils/alerts";
import ProductModal from "./ProductModal";
import ProductDetailsModal from "./ProductDetailsModal";
import "./Products.css";

const API_URL = import.meta.env.VITE_API_URL + "/api";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const CONTRACT_ABI = ["function buyProduct(uint256 _productId) public payable"];

const Products = ({ role, searchTerm = "" }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buyingId, setBuyingId] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToEdit, setProductToEdit] = useState(null);

  const [purchasedIds, setPurchasedIds] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("jwt_token");
      const response = await axios.get(`${API_URL}/Products`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setProducts(response.data);
      setError(null);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setProducts([]);
        setError(null);
      } else {
        setError("Не вдалося завантажити товари");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (product) => {
    const isConfirmed = await confirmDelete(product.title);

    if (isConfirmed) {
      try {
        const token = localStorage.getItem("jwt_token");
        await axios.delete(`${API_URL}/Products/${product.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showSuccess("Видалено", "Товар успішно видалено з бази даних");
        setProducts(products.filter((p) => p.id !== product.id));
      } catch (err) {
        showError("Помилка видалення", err.response?.data || err.message);
      }
    }
  };

  const openEditModal = (product) => {
    setProductToEdit(product);
    setIsEditModalOpen(true);
  };

  const handleBuy = async (product) => {
    try {
      setBuyingId(product.id);
      if (!window.ethereum) throw new Error("MetaMask не знайдено");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer,
      );

      const tx = await contract.buyProduct(product.id, {
        value: BigInt(product.priceWei ? product.priceWei.toString() : "0"),
      });

      await tx.wait();
      showSuccess("Успіх", "Товар успішно придбано");

      setSelectedProduct(null);
      setPurchasedIds((prev) => [...prev, product.id]);
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p.id === product.id ? { ...p, isActive: false } : p,
        ),
      );

      setTimeout(() => fetchProducts(), 5000);
    } catch (err) {
      showError("Помилка оплати", err.message);
    } finally {
      setBuyingId(null);
    }
  };

  const canManageProducts =
    role === "Admin" || role === "SuperAdmin" || role === "Owner";

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      (p.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (p.category?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    if (canManageProducts) return matchesSearch;
    return p.isActive && !purchasedIds.includes(p.id) && matchesSearch;
  });

  return (
    <>
      <div className="glass-panel products-container">
        <div className="panel-header">
          <h2>
            {canManageProducts
              ? "📦 Управління товарами"
              : "🛒 Вітрина техніки"}
          </h2>
          {canManageProducts && (
            <button
              className="btn-primary"
              onClick={() => setIsAddModalOpen(true)}
            >
              + Додати товар
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-state">⏳ Завантаження товарів...</div>
        ) : error ? (
          <div className="error-state">❌ {error}</div>
        ) : filteredProducts.length === 0 ? (
          <p className="empty-state">
            {searchTerm ? "Нічого не знайдено." : "Товарів поки немає."}
          </p>
        ) : (
          <>
            {canManageProducts ? (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Фото</th>
                      <th>Назва</th>
                      <th>Категорія</th>
                      <th>Ціна (ETH)</th>
                      <th>Статус</th>
                      <th>Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div className="table-img-wrapper">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt="img" />
                            ) : (
                              <div className="no-img-mini">Немає</div>
                            )}
                          </div>
                        </td>
                        <td className="fw-bold">{product.title}</td>
                        <td>
                          <span className="category-tag">
                            {product.category}
                          </span>
                        </td>
                        <td className="eth-price">
                          {ethers.formatEther(
                            product.priceWei?.toString() || "0",
                          )}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${product.isActive ? "active" : "inactive"}`}
                          >
                            {product.isActive ? "Активний" : "Знято"}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="action-btn edit"
                              onClick={() => openEditModal(product)}
                            >
                              ✏️
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={() => handleDelete(product)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map((product) => (
                  <div
                    className="product-card-user"
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                  >
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
                        {product.description || "Опис відсутній"}
                      </p>
                      <div className="product-buy-section">
                        <div className="price-tag">
                          <span className="eth-symbol">Ξ</span>{" "}
                          {ethers.formatEther(
                            product.priceWei?.toString() || "0",
                          )}
                        </div>
                        <button
                          className="btn-primary buy-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuy(product);
                          }}
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

      <ProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchProducts}
      />

      <ProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchProducts}
        initialData={productToEdit}
      />

      <ProductDetailsModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        onBuy={handleBuy}
        buyingId={buyingId}
      />
    </>
  );
};

export default Products;
