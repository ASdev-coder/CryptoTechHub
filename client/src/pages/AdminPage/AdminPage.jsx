import React, { useState } from "react";
import Header from "../../components/Header/Header";
import SearchInput from "../../components/SearchInput/SearchInput";
import Users from "../../components/Users/Users";
import Products from "../../components/Products/Products";
import "./AdminPage.css";

const AdminPage = ({
  logout,
  account,
  avatarUrl,
  userProfile,
  onProfileUpdate,
}) => {
  const [productSearch, setProductSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  return (
    <div className="admin-page-wrapper">
      <Header
        logout={logout}
        account={account}
        avatarUrl={avatarUrl}
        userProfile={userProfile}
        onProfileUpdate={onProfileUpdate}
      >
        <SearchInput
          placeholder="Шукати юзерів..."
          value={userSearch}
          onChange={setUserSearch}
        />
        <SearchInput
          placeholder="Шукати товари..."
          value={productSearch}
          onChange={setProductSearch}
        />
      </Header>

      <div className="admin-content">
        <h1 className="admin-title">👑 Панель Адміністратора</h1>
        <div className="admin-panel">
          <div className="admin-main-section">
            <Products role="Admin" searchTerm={productSearch} />
          </div>
          <div className="admin-side-section">
            <Users role="Admin" searchTerm={userSearch} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
