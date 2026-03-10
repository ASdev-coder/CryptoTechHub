import React from "react";
import "./SearchInput.css";

const SearchInput = ({ placeholder, value, onChange }) => {
  return (
    <div className="search-input-container">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        className="custom-search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchInput;
