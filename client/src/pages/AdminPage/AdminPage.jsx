import React from "react";
import Header from "../../components/Header/Header";
import SearchInput from "../../components/SearchInput/SearchInput";
import Users from "../../components/Users/Users";
import Products from "../../components/Products/Products";
import "./AdminPage.css";

const AdminPage = ({ logout, account, avatarUrl, userProfile, setUserProfile }) => {
  return (
    <div className="admin-page-wrapper">
      <Header logout={logout} account={account} avatarUrl={avatarUrl} userProfile={userProfile} onProfileUpdate={setUserProfile}>
        <SearchInput placeholder="Шукати по назві (Admin)..." />
      </Header>

      <div className="admin-content">
        <h1 className="admin-title">👑 Панель Адміністратора</h1>
        <div className="admin-panel">
          <div className="admin-main-section">
            <Products role = "Admin"/>
          </div>
          <div className="admin-side-section">
            <Users role="Admin" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
