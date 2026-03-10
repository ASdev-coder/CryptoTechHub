import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Header from "../../components/Header/Header";
import SearchInput from "../../components/SearchInput/SearchInput";
import Users from "../../components/Users/Users";
import { showSuccess, showError } from "../../utils/alerts";
import "./OwnerPage.css";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const CONTRACT_ABI = [
  "function withdrawContractBalance() public",
  "function setSuperAdmin(address _superAdmin) public",
  "function superAdmin() public view returns (address)",
];

const OwnerPage = ({
  logout,
  account,
  avatarUrl,
  userProfile,
  onProfileUpdate,
}) => {
  const [contractBalance, setContractBalance] = useState("0");
  const [newSuperAdmin, setNewSuperAdmin] = useState("");
  const [currentSuperAdmin, setCurrentSuperAdmin] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContractData();
  }, []);

  const fetchContractData = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(CONTRACT_ADDRESS);
      setContractBalance(ethers.formatEther(balance));

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider,
      );
      const sAdmin = await contract.superAdmin();
      setCurrentSuperAdmin(sAdmin);
    } catch (err) {
      console.error("Web3 Error:", err);
    }
  };

  const handleWithdraw = async () => {
    try {
      setLoading(true);

      if (contractBalance === "0.0") {
        return showError("Помилка", "Немає коштів для виведення");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer,
      );

      const tx = await contract.withdrawContractBalance();
      await tx.wait();

      showSuccess("Кошти успішно виведено на ваш гаманець!");
      fetchContractData();
    } catch (err) {
      showError("Помилка виводу", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetSuperAdmin = async () => {
    if (!ethers.isAddress(newSuperAdmin)) {
      return showError("Помилка", "Введіть коректну адресу гаманця");
    }
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer,
      );

      const tx = await contract.setSuperAdmin(newSuperAdmin);
      await tx.wait();

      showSuccess("Нового Super Admin успішно призначено!");
      setCurrentSuperAdmin(newSuperAdmin);
      setNewSuperAdmin("");
    } catch (err) {
      showError("Помилка призначення", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page-wrapper">
      <Header
        logout={logout}
        account={account}
        avatarUrl={avatarUrl}
        userProfile={userProfile}
        onProfileUpdate={onProfileUpdate}
      >
      </Header>

      <div className="admin-content">
        <h1 className="owner-title">Owner Panel</h1>

        <div className="owner-top-grid">
          <div className="glass-panel owner-card finance-card">
            <div className="card-header-info">
              <span className="stat-label">Баланс контракту</span>
              <h2 className="stat-value text-gradient-blue">
                Ξ {contractBalance}
              </h2>
            </div>
            <button
              className="btn-primary withdraw-btn"
              onClick={handleWithdraw}
              disabled={loading || contractBalance === "0"}
            >
              {loading ? "⏳ Обробка..." : "Вивести на мій гаманець"}
            </button>
          </div>

          <div className="glass-panel owner-card admin-manage-card">
            <div className="card-header-info">
              <span className="stat-label">Керування Super Admin</span>
              <p className="current-admin-info">
                Поточний:{" "}
                <span>
                  {currentSuperAdmin
                    ? `${currentSuperAdmin.slice(0, 12)}...${currentSuperAdmin.slice(-8)}`
                    : "Завантаження..."}
                </span>
              </p>
            </div>
            <div className="admin-input-group">
              <input
                type="text"
                className="custom-input"
                placeholder="Вставте адресу 0x..."
                value={newSuperAdmin}
                onChange={(e) => setNewSuperAdmin(e.target.value)}
              />
              <button
                className="btn-save"
                onClick={handleSetSuperAdmin}
                disabled={loading || !newSuperAdmin}
              >
                Set
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerPage;
