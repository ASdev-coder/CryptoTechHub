import React from "react";
import { ethers } from "ethers";
import "./ProductDetailsModal.css";

const ProductDetailsModal = ({ isOpen, onClose, product, onBuy, buyingId }) => {
  if (!isOpen || !product) return null;

  const handleOverlayClick = (e) => {
    if (e.target.className === "modal-overlay") {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content glass-panel details-modal-content">
        <button className="details-close-btn" onClick={onClose}>
          &times;
        </button>

        <div className="details-image-container">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.title} />
          ) : (
            <div className="avatar-placeholder empty-photo">
              📦 ФОТО ВІДСУТНЄ
            </div>
          )}
        </div>

        <div className="details-info">
          <div className="details-header">
            <span className="product-category-badge details-badge">
              {product.category}
            </span>
            <h2 className="details-title">{product.title}</h2>
          </div>

          <div className="details-desc">
            {product.description || "Опис відсутній"}
          </div>

          <div className="details-footer">
            <div className="details-price">
              <span className="eth-symbol">Ξ</span>
              {ethers.formatEther(
                product.priceWei ? product.priceWei.toString() : "0",
              )}
            </div>

            <button
              className="btn-primary buy-btn details-buy-btn"
              onClick={() => onBuy(product)}
              disabled={buyingId === product.id}
            >
              {buyingId === product.id ? "⏳ Обробка..." : "Купити зараз"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;
