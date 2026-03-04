import React from 'react';

const OwnerPage = ({ logout, account, avatarUrl }) => {
    return (
        <div>
            <h1>Owner Page</h1>
            <h2>Account: {account}</h2>
            <img src={avatarUrl} alt="" />
            <button onClick={logout}>logout</button>
        </div>
    );
}

export default OwnerPage;
