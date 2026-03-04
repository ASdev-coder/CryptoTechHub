import { useState, useEffect } from "react";
import axios from "axios";
import "./Users.css";

const API_URL = import.meta.env.VITE_API_URL + "/api";

const Users = ({ role }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading)
    return <div className="loading-state">⏳ Завантаження користувачів...</div>;
  if (error) return <div className="error-state">❌ {error}</div>;

  const getRoleBadge = (userRole) => {
    if (userRole === 3) return <span className="role-badge owner">Owner</span>; //
    if (userRole === 2)
      return <span className="role-badge super-admin">Super Admin</span>; //
    if (userRole === 1) return <span className="role-badge admin">Admin</span>; //
    return <span className="role-badge user">User</span>; //
  };

  return (
    <div className="glass-panel users-container">
      <div className="panel-header">
        <h2>
          👥 {role === "SuperAdmin" ? "Управління Доступом" : "Користувачі"}
        </h2>

        {role === "SuperAdmin" && (
          <button className="btn-assign-admin">+ Призначити Адміна</button>
        )}
      </div>

      {users.length === 0 ? (
        <p className="empty-state">Користувачів не знайдено.</p>
      ) : (
        <div className="users-list">
          {users.map((user) => (
            <div className="user-card" key={user.id}>
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
                  {role === "Admin" && user.role === 0 && (
                    <button className="btn-action block">Заблокувати</button>
                  )}

                  {role === "SuperAdmin" && (
                    <>
                      {user.role === 0 && (
                        <>
                          <button className="btn-action block">
                            Заблокувати
                          </button>
                        </>
                      )}
                      {user.role === 1 && (
                        <button className="btn-action remove">
                          Видалити Адміна
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users;
