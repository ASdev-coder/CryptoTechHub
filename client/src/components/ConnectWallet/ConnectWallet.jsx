import React from "react";
import "./ConnectWallet.css";

const ConnectWallet = ({ loginWithWeb3, loading }) => {
  return (
    <div className="container">
      <div className="connect-wallet">
        <div className="info">
          <h1>Вхід у систему</h1>
          <p>
            Підключіть свій Web3 гаманець, щоб отримати доступ до маркетплейсу
          </p>
        </div>

        <div className="action-area">
          <button
            className="btn-primary"
            onClick={loginWithWeb3}
            disabled={loading}
          >
            {loading ? "Підписання в MetaMask..." : "🦊 Підключити MetaMask"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectWallet;
