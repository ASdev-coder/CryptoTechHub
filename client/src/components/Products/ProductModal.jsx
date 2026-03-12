import React, { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import "../Profile/EditProfileModal.css";
import { showSuccess } from "../../utils/alerts";

const API_URL = import.meta.env.VITE_API_URL + "/api";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const CONTRACT_ABI = [
  "function setProductPrice(uint256 _productId, uint256 _priceWei) public",
];

const ProductModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const isEditing = !!initialData;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [priceEth, setPriceEth] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setTitle(initialData.title || "");
        setCategory(initialData.category || "");
        setDescription(initialData.description || "");
        setPriceEth(
          initialData.priceWei
            ? ethers.formatEther(initialData.priceWei.toString())
            : "",
        );
        setIsActive(
          initialData.isActive !== undefined ? initialData.isActive : true,
        );
        setPreviewUrl(initialData.imageUrl || "");
        setImageFile(null);
      } else {
        setTitle("");
        setCategory("");
        setDescription("");
        setPriceEth("");
        setIsActive(true);
        setPreviewUrl("");
        setImageFile(null);
      }
      setError("");
    }
  }, [isOpen, isEditing, initialData]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!window.ethereum)
        throw new Error("MetaMask не знайдено! Встановіть розширення.");

      if (!title || !category || !priceEth || !description) {
        throw new Error("Будь ласка, заповніть всі обов'язкові поля.");
      }

      if (isNaN(priceEth) || Number(priceEth) <= 0) {
        throw new Error("Ціна повинна бути більшою за нуль.");
      }

      const priceWei = ethers.parseEther(priceEth.toString()).toString();
      const token = localStorage.getItem("jwt_token");

      const formData = new FormData();
      formData.append("Title", title);
      formData.append("Category", category);
      formData.append("Description", description);
      formData.append("PriceWei", priceWei);

      if (isEditing) {
        formData.append("IsActive", isActive);
        if (!imageFile && previewUrl && !previewUrl.startsWith("blob:")) {
          formData.append("ImageUrl", previewUrl);
        }
      }

      if (imageFile) formData.append("Image", imageFile);

      setLoadingText("Збереження в базу даних...");

      let currentProductId = isEditing ? initialData.id : null;

      if (isEditing) {
        await axios.put(`${API_URL}/Products/${currentProductId}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        const response = await axios.post(`${API_URL}/Products`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        currentProductId = response.data.id;

        if (!currentProductId) {
          throw new Error("Бекенд не повернув ID товару. Перевірте API.");
        }
      }

      const initialPriceWei =
        isEditing && initialData.priceWei
          ? initialData.priceWei.toString()
          : null;

      if (!isEditing || priceWei !== initialPriceWei) {
        setLoadingText("Підтвердіть транзакцію в MetaMask...");
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer,
        );

        const tx = await contract.setProductPrice(currentProductId, priceWei);

        setLoadingText("Запис у блокчейн... Зачекайте.");
        await tx.wait();
      }

      showSuccess(`Товар успішно ${isEditing ? "оновлено" : "додано"}!`);

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);

      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors;
        const firstErrorKey = Object.keys(validationErrors)[0];
        setError(
          `Помилка поля ${firstErrorKey}: ${validationErrors[firstErrorKey][0]}`,
        );
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Помилка при збереженні товару.",
        );
      }
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === "modal-overlay" && !loading) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content glass-panel" style={{ maxWidth: "500px" }}>
        <div className="modal-header">
          <h2>{isEditing ? "Редагувати товар" : "Додати новий товар"}</h2>
          <button className="btn-close" onClick={onClose} disabled={loading}>
            &times;
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="avatar-upload-section">
            <div
              className="avatar-preview"
              style={{ borderRadius: "12px", width: "120px", height: "120px" }}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" />
              ) : (
                <div
                  className="avatar-placeholder"
                  style={{ fontSize: "30px" }}
                >
                  📦
                </div>
              )}
            </div>
            <div className="avatar-input-wrapper">
              <label htmlFor="product-image-upload" className="btn-upload">
                {previewUrl ? "Змінити фото" : "Завантажити фото"}
              </label>
              <input
                id="product-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={loading}
                hidden
              />
            </div>
          </div>

          <div className="form-group">
            <label>Назва товару (до 70 символів)</label>
            <input
              type="text"
              maxLength={70}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Наприклад: Ноутбук HP Victus"
              disabled={loading}
            />
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Категорія * (до 30 символів)</label>
              <input
                type="text"
                maxLength={30}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Laptops, Phones..."
                disabled={loading}
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>Ціна (ETH) *</label>
              <input
                type="number"
                step="0.000001"
                min="0"
                value={priceEth}
                onChange={(e) => setPriceEth(e.target.value)}
                placeholder="0.05"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Опис *</span>
              <span
                style={{
                  fontSize: "12px",
                  color: description.length > 900 ? "#ef4444" : "#cbd5e1",
                }}
              >
                {description.length}/1000
              </span>
            </label>
            <textarea
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Детальний опис характеристик..."
              rows="4"
              disabled={loading}
            />
          </div>

          {isEditing && (
            <div
              className="form-group"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              <input
                type="checkbox"
                id="isActiveCheck"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={loading}
                style={{ width: "auto", margin: 0 }}
              />
              <label
                htmlFor="isActiveCheck"
                style={{ margin: 0, cursor: "pointer", color: "#e2e8f0" }}
              >
                Активний для продажу
              </label>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Скасувати
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading
                ? loadingText || "Обробка..."
                : isEditing
                  ? "Зберегти зміни"
                  : "Створити товар"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
