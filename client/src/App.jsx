import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import ConnectWallet from "./components/ConnectWallet/ConnectWallet";
import { useWeb3Auth } from "./hooks/useWeb3Auth";
import AdminPage from "./pages/AdminPage/AdminPage";
import SuperAdminPage from "./pages/SuperAdminPage/SuperAdminPage";
import UserPage from "./pages/UserPage/UserPage";
import OwnerPage from "./pages/OwnerPage/OwnerPage";


function App() {
  const { account, token, loading, userProfile, loginWithWeb3, logout, setUserProfile } =
    useWeb3Auth();

  const getUserRole = () => {
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      console.log("Декодований токен:", decoded);
      return (
        decoded.role ||
        decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
      );
    } catch (error) {
      console.error("Помилка читання токена", error);
      return null;
    }
  };

  const role = getUserRole();

  return (
    <Router>
      <Routes>
        {!token || loading ? (
          <Route
            path="*"
            element={
              <ConnectWallet loginWithWeb3={loginWithWeb3} loading={loading} />
            }
          />
        ) : (
          <>
            {role === "User" && (
              <>
                <Route
                  path="/marketplace"
                  element={
                    <UserPage
                      logout={logout}
                      account={account}
                      avatarUrl={userProfile?.profileImageUrl}
                      userProfile={userProfile}
                      onProfileUpdate={setUserProfile}
                    />
                  }
                />
                <Route
                  path="*"
                  element={<Navigate to="/marketplace" replace />}
                />
              </>
            )}

            {role === "Admin" && (
              <>
                <Route
                  path="/admin"
                  element={
                    <AdminPage
                      logout={logout}
                      account={account}
                      avatarUrl={userProfile?.profileImageUrl}
                      userProfile={userProfile}
                      onProfileUpdate={setUserProfile}
                    />
                  }
                />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </>
            )}

            {role === "SuperAdmin" && (
              <>
                <Route
                  path="/superadmin"
                  element={
                    <SuperAdminPage
                      logout={logout}
                      account={account}
                      avatarUrl={userProfile?.profileImageUrl}
                      userProfile={userProfile}
                      onProfileUpdate={setUserProfile}
                    />
                  }
                />
                <Route
                  path="*"
                  element={<Navigate to="/superadmin" replace />}
                />
              </>
            )}

            {role === "Owner" && (
              <>
                <Route
                  path="/owner"
                  element={
                    <OwnerPage
                      logout={logout}
                      account={account}
                      avatarUrl={userProfile?.profileImageUrl}
                      userProfile={userProfile}
                      onProfileUpdate={setUserProfile}
                    />
                  }
                />
                <Route path="*" element={<Navigate to="/owner" replace />} />
              </>
            )}
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
