import { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import "./Users.css";
import { showError } from "../../utils/alerts";
import AddAdminModal from "./AddAdminModal";

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
const contractABI = [
  "function toggleUserBlockStatus(address _user) public",
  "function removeAdmin(address _admin) public",
  "function addAdmin(address _admin) public",
];
const API_URL = import.meta.env.VITE_API_URL + "/api";

const Users = ({ role, searchTerm = "" }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [processingAddress, setProcessingAddress] = useState(null);
  const [removingAdminAddress, setRemovingAdminAddress] = useState(null);
  const [addingAdminAddress, setAddingAdminAddress] = useState(null);

  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("jwt_token");
      const response = await axios.get(`${API_URL}/Users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (err) {
      console.error(err);
      setError("Не вдалося завантажити користувачів");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (userWalletAddress) => {
    try {
      if (!window.ethereum) throw new Error("MetaMask не знайдено");
      setProcessingAddress(userWalletAddress);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer,
      );

      const tx = await contract.toggleUserBlockStatus(userWalletAddress);
      await tx.wait();

      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.walletAddress === userWalletAddress
            ? { ...u, isBlocked: !u.isBlocked }
            : u,
        ),
      );
    } catch (err) {
      showError("Помилка блокування", err.message);
    } finally {
      setProcessingAddress(null);
    }
  };

  const handleRemoveAdmin = async (userWalletAddress) => {
    try {
      if (!window.ethereum) throw new Error("MetaMask не знайдено");
      setRemovingAdminAddress(userWalletAddress);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer,
      );

      const tx = await contract.removeAdmin(userWalletAddress);
      await tx.wait();
      
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.walletAddress === userWalletAddress ? { ...u, role: 0 } : u,
        ),
      );
    } catch (err) {
      showError("Помилка видалення адміна", err.message);
    } finally {
      setRemovingAdminAddress(null);
    }
  };

  const handleAddAdmin = async (userWalletAddress) => {
    try {
      if (!window.ethereum) throw new Error("MetaMask не знайдено");
      setAddingAdminAddress(userWalletAddress);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer,
      );

      const tx = await contract.addAdmin(userWalletAddress);
      await tx.wait();

      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.walletAddress.toLowerCase() === userWalletAddress.toLowerCase()
            ? { ...u, role: 1 }
            : u,
        ),
      );
      setIsAddAdminModalOpen(false);
    } catch (err) {
      showError("Помилка призначення адміна", err.message);
    } finally {
      setAddingAdminAddress(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.walletAddress?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ),
  );

  if (loading) {
    return <div className="loading-state">⏳ Завантаження користувачів...</div>;
  }
  if (error) {
    return <div className="error-state">❌ {error}</div>;
  }

  const getRoleBadge = (userRole) => {
    if (userRole === 3) return <span className="role-badge owner">Owner</span>;
    if (userRole === 2)
      return <span className="role-badge super-admin">Super Admin</span>;
    if (userRole === 1) return <span className="role-badge admin">Admin</span>;
    return <span className="role-badge user">User</span>;
  };

  return (
    <>
      <div className="glass-panel users-container">
        <div className="panel-header">
          <h2>
            👥{" "}
            {role === "SuperAdmin" || role === "Owner"
              ? "Управління Доступом"
              : "Користувачі"}
          </h2>
          {(role === "SuperAdmin" || role === "Owner") && (
            <button
              className="btn-assign-admin"
              onClick={() => setIsAddAdminModalOpen(true)}
            >
              + Призначити Адміна
            </button>
          )}
        </div>

        {filteredUsers.length === 0 ? (
          <p className="empty-state">
            {searchTerm ? "Нікого не знайдено." : "Користувачів не знайдено."}
          </p>
        ) : (
          <div className="users-list">
            {filteredUsers.map((user) => (
              <div
                className="user-card"
                key={user.id}
                style={{ opacity: user.isBlocked ? 0.6 : 1 }}
              >
                <div className="user-card-header">
                  <div className="user-info">
                    <div className="user-avatar-mini">
                      {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt="avatar" />
                      ) : (
                        <div className="avatar-placeholder-mini" />
                      )}
                    </div>
                    <span className="user-name">
                      {user.username || "Без імені"}
                      {user.isBlocked && (
                        <span
                          className="blocked-text"
                          style={{
                            color: "#ef4444",
                            fontSize: "11px",
                            marginLeft: "8px",
                            fontWeight: "bold",
                          }}
                        >
                          (Заблокований)
                        </span>
                      )}
                    </span>
                  </div>
                  {getRoleBadge(user.role)}
                </div>

                <div className="user-footer">
                  <code className="wallet-address">
                    {user.walletAddress.slice(0, 8)}...
                    {user.walletAddress.slice(-6)}
                  </code>

                  <div className="user-actions">
                    {(role === "SuperAdmin" || role === "Owner") &&
                      user.role === 0 &&
                      !user.isBlocked && (
                        <button
                          className="btn-action"
                          onClick={() => handleAddAdmin(user.walletAddress)}
                          disabled={addingAdminAddress === user.walletAddress}
                          style={{ borderColor: "#3b82f6", color: "#3b82f6" }}
                        >
                          {addingAdminAddress === user.walletAddress
                            ? "⏳..."
                            : "Зробити Адміном"}
                        </button>
                      )}

                    {(role === "SuperAdmin" || role === "Owner") &&
                      user.role === 1 && (
                        <button
                          className="btn-action remove"
                          onClick={() => handleRemoveAdmin(user.walletAddress)}
                          disabled={removingAdminAddress === user.walletAddress}
                        >
                          {removingAdminAddress === user.walletAddress
                            ? "⏳..."
                            : "Видалити Адміна"}
                        </button>
                      )}

                    {["Admin", "SuperAdmin", "Owner"].includes(role) &&
                      user.role === 0 && (
                        <button
                          className="btn-action"
                          onClick={() => handleToggleBlock(user.walletAddress)}
                          disabled={processingAddress === user.walletAddress}
                          style={{
                            borderColor: user.isBlocked ? "#22c55e" : "#f59e0b",
                            color: user.isBlocked ? "#22c55e" : "#f59e0b",
                          }}
                        >
                          {processingAddress === user.walletAddress
                            ? "⏳..."
                            : user.isBlocked
                              ? "Розблокувати"
                              : "Заблокувати"}
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddAdminModal
        isOpen={isAddAdminModalOpen}
        onClose={() => setIsAddAdminModalOpen(false)}
        onAddAdmin={handleAddAdmin}
        loading={addingAdminAddress !== null}
      />
    </>
  );
};

export default Users;
