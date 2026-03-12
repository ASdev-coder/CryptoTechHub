import React from "react";
import "./BlockedPage.css";

const BlockedPage = ({ logout, account }) => {
  const formatAddress = (address) => {
    if (!address) return "Web3 Гаманець";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="container">
      <div className="blocked-card glass-panel">
        <div className="blocked-icon">
          <span role="img" aria-label="locked">
            🔒
          </span>
        </div>

        <div className="blocked-info">
          <h1>Доступ заборонено</h1>
          <p>
            Ваш обліковий запис <code>{formatAddress(account)}</code> був
            заблокований адміністрацією маркетплейсу.
          </p>
          <p className="sub-text">
            Якщо ви вважаєте, що це сталося помилково, або хочете дізнатися
            причину, будь ласка, зверніться до служби підтримки або власника
            смарт-контракту.
          </p>
        </div>

        <div className="blocked-actions">
          <button className="btn-logout-blocked" onClick={logout}>
            Вийти з акаунта
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockedPage;
