import React, { useState } from "react";
import Header from "../../components/Header/Header";
import SearchInput from "../../components/SearchInput/SearchInput";
import Products from "../../components/Products/Products";
import "../AdminPage/AdminPage.css";

const UserPage = ({
  logout,
  account,
  avatarUrl,
  userProfile,
  onProfileUpdate,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="admin-page-wrapper">
      <Header
        logout={logout}
        account={account}
        avatarUrl={avatarUrl}
        role="User"
        userProfile={userProfile}
        onProfileUpdate={onProfileUpdate}
      >
        <SearchInput
          placeholder="Пошук по каталогу техніки..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </Header>

      <div className="admin-content">
        <h1
          className="admin-title"
          style={{
            background: "linear-gradient(135deg, #34d399, #3b82f6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          🛒 Маркетплейс Техніки
        </h1>
        <div className="marketplace-section">
          <Products role="User" searchTerm={searchQuery} />
        </div>
      </div>
    </div>
  );
};
export default UserPage;
