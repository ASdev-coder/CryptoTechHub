import React from 'react';
import './SearchInput.css';

const SearchInput = ({placeholder}) => {
    return (
        <div>
            <input type="text" placeholder={placeholder}/>
        </div>
    );
}

export default SearchInput;
