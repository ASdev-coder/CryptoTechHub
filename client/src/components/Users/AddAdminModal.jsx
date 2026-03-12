import React, { useState } from "react";
import { ethers } from "ethers";
import "../Profile/EditProfileModal.css";

const AddAdminModal = ({ isOpen, onClose, onAddAdmin, loading }) => {
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedAddress = walletAddress.trim();

    if (!trimmedAddress) {
      setError("Будь ласка, введіть адресу гаманця.");
      return;
    }

    if (!ethers.isAddress(trimmedAddress)) {
      setError("Невірний формат Ethereum адреси (має починатися з 0x...).");
      return;
    }

    await onAddAdmin(trimmedAddress);

    if (!error) {
      setWalletAddress("");
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === "modal-overlay" && !loading) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h2>Призначити Адміна</h2>
          <button className="btn-close" onClick={onClose} disabled={loading}>
            &times;
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Адреса гаманця</label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x123..."
              disabled={loading}
              style={{ fontFamily: "monospace" }}
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
              {loading ? "Призначення..." : "Призначити"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAdminModal;
