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
import BlockedPage from "./pages/BlockedPage/BlockedPage";

function App() {
  const {
    account,
    token,
    loading,
    userProfile,
    isBlocked,
    loginWithWeb3,
    logout,
    setUserProfile,
  } = useWeb3Auth();

  const getUserData = () => {
    if (!token) return { role: null, tokenBlocked: false };
    try {
      const decoded = jwtDecode(token);
      if (!decoded) return { role: null, tokenBlocked: false };

      const role =
        decoded.role ||
        decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

      const rawBlocked = decoded.isBlocked || decoded.IsBlocked;
      const tokenBlocked = String(rawBlocked).toLowerCase() === "true";

      return { role, tokenBlocked };
    } catch (error) {
      console.error("JWT Decode Error:", error);
      return { role: null, tokenBlocked: false };
    }
  };

  const { role, tokenBlocked } = getUserData();

  const isActuallyBlocked =
    isBlocked || tokenBlocked || userProfile?.isBlocked === true;

  return (
    <Router>
      <Routes>
        {isActuallyBlocked ? (
          <>
            <Route path="/blocked" element={<BlockedPage logout={logout} />} />
            <Route path="*" element={<Navigate to="/blocked" replace />} />
          </>
        ) : !token ? (
          <Route
            path="*"
            element={
              <ConnectWallet loginWithWeb3={loginWithWeb3} loading={loading} />
            }
          />
        ) : (
          <>
            {role === "User" && (
              <Route
                path="*"
                element={
                  <UserPage
                    logout={logout}
                    account={account}
                    userProfile={userProfile}
                    onProfileUpdate={setUserProfile}
                  />
                }
              />
            )}
            {role === "Admin" && (
              <Route
                path="*"
                element={
                  <AdminPage
                    logout={logout}
                    account={account}
                    userProfile={userProfile}
                    onProfileUpdate={setUserProfile}
                  />
                }
              />
            )}
            {role === "SuperAdmin" && (
              <Route
                path="*"
                element={
                  <SuperAdminPage
                    logout={logout}
                    account={account}
                    userProfile={userProfile}
                    onProfileUpdate={setUserProfile}
                  />
                }
              />
            )}
            {role === "Owner" && (
              <Route
                path="*"
                element={
                  <OwnerPage
                    logout={logout}
                    account={account}
                    userProfile={userProfile}
                    onProfileUpdate={setUserProfile}
                  />
                }
              />
            )}

            {!role && (
              <Route
                path="*"
                element={<div className="loading-state">Завантаження...</div>}
              />
            )}
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
