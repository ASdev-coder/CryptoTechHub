import React, { useState, useEffect } from "react";
import "./Header.css";
import { ethers } from "ethers";
import EditProfileModal from "../Profile/EditProfileModal";

const Header = ({
  children,
  logout,
  account,
  role,
  userProfile,
  onProfileUpdate,
}) => {
  const [balance, setBalance] = useState("0.0");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentAvatar = userProfile?.profileImageUrl;

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    let isMounted = true;
    const updateBalance = async () => {
      if (!account || !window.ethereum) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balanceWei = await provider.getBalance(account);
        const balanceEth = ethers.formatEther(balanceWei);
        if (isMounted) setBalance(parseFloat(balanceEth).toFixed(4));
      } catch (error) {
        console.error("Помилка балансу:", error);
      }
    };
    updateBalance();
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", updateBalance);
      return () => {
        isMounted = false;
        window.ethereum.removeListener("accountsChanged", updateBalance);
      };
    }
  }, [account]);

  return (
    <div className="header">
      <div className="header-logo">
        <span className="logo-text">TechMarket</span>
      </div>

      <div className="header-center">{children}</div>

      <div className="header-profile">
        {role === "User" && (
          <div className="balance-display">
            <span className="eth-icon">Ξ</span> {balance} ETH
          </div>
        )}

        {account && (
          <div className="profile-address" title={account}>
            {formatAddress(account)}
          </div>
        )}

        <button
          className="profile-image-button"
          onClick={() => setIsModalOpen(true)}
        >
          {currentAvatar ? (
            <img
              key={currentAvatar}
              className="avatar-image"
              src={currentAvatar}
              alt="Профіль"
            />
          ) : (
            <div className="avatar-placeholder">👤</div>
          )}
        </button>

        <button className="logout-button" onClick={logout}>
          Вийти
        </button>
      </div>

      <EditProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentProfile={userProfile}
        onUpdateSuccess={(updatedData) => {
          if (onProfileUpdate) {
            onProfileUpdate(updatedData);
          }
        }}
      />
    </div>
  );
};

export default Header;
