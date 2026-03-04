import React from "react";
import Header from "../../components/Header/Header";
import SearchInput from "../../components/SearchInput/SearchInput";
import Users from "../../components/Users/Users";
import Products from "../../components/Products/Products";
import "../AdminPage/AdminPage.css";


const SuperAdminPage = ({ logout, account, avatarUrl, userProfile, setUserProfile }) => {
  return (
    <div className="admin-page-wrapper">
      <Header logout={logout} account={account} avatarUrl={avatarUrl} userProfile={userProfile} onProfileUpdate={setUserProfile}>
        <SearchInput placeholder="Шукати юзерів" />
        <SearchInput placeholder="Шукати товари..." />
      </Header>

      <div className="admin-content">
        <h1
          className="admin-title"
          style={{
            background: "linear-gradient(135deg, #f59e0b, #ef4444)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          👑 Панель Головного Адміністратора (Super Admin)
        </h1>

        <div className="admin-panel">
          <div className="admin-main-section">
            <Products role="Admin" />
          </div>

          <div className="admin-side-section">
            <Users role="SuperAdmin" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPage;
