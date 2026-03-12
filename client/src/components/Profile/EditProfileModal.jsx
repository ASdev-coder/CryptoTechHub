import React, { useState, useEffect } from "react";
import axios from "axios";
import "./EditProfileModal.css";

const API_URL = import.meta.env.VITE_API_URL + "/api";

const EditProfileModal = ({
  isOpen,
  onClose,
  currentProfile,
  onUpdateSuccess,
}) => {
  const [userName, setUserName] = useState("");
  const [bio, setBio] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && currentProfile) {
      setUserName(currentProfile.username || "");
      setBio(currentProfile.bio || "");

      const initialUrl = currentProfile.profileImageUrl
        ? `${currentProfile.profileImageUrl}?t=${new Date().getTime()}`
        : "";

      setPreviewUrl(initialUrl);
      setImageFile(null);
      setError("");
    }
  }, [isOpen, currentProfile]);

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
      const token = localStorage.getItem("jwt_token");
      const formData = new FormData();

      if (userName) formData.append("UserName", userName);
      if (bio) formData.append("Bio", bio);
      if (imageFile) formData.append("ProfileImage", imageFile);

      const response = await axios.put(`${API_URL}/Users/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const timestamp = new Date().getTime();
      const updatedProfile = {
        ...response.data,
        profileImageUrl: response.data.profileImageUrl
          ? `${response.data.profileImageUrl}?t=${timestamp}`
          : null,
      };

      onUpdateSuccess(updatedProfile);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Помилка при збереженні профілю. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === "modal-overlay") {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h2>Налаштування профілю</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="avatar-upload-section">
            <div className="avatar-preview">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" />
              ) : (
                <div className="avatar-placeholder">👤</div>
              )}
            </div>
            <div className="avatar-input-wrapper">
              <label htmlFor="avatar-upload" className="btn-upload">
                Змінити фото
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                hidden
              />
            </div>
          </div>

          <div className="form-group">
            <label>Ім'я користувача</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Введіть ваше ім'я"
            />
          </div>

          <div className="form-group">
            <label>Про себе</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Напишіть кілька слів про себе..."
              rows="3"
            />
          </div>

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
              {loading ? "Збереження..." : "Зберегти зміни"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
