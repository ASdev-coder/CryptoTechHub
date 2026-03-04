import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export const useWeb3Auth = () => {
  const [account, setAccount] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("jwt_token"));
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);


  const checkConnection = useCallback(async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
 
          if (token) {
            const response = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/Users/profile`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            setUserProfile(response.data);
          }
        }
      }
    } catch (err) {
      console.error("Помилка ініціалізації аккаунта", err);
    } finally {
      setLoading(false);
    }
  }, [token]);


  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const loginWithWeb3 = async () => {
    setLoading(true);
    try {
      if (!window.ethereum) throw new Error("MetaMask не знайдено");

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const address = accounts[0];

       const { data: result } = await axios.get(
         `${import.meta.env.VITE_API_URL}/api/Auth/nonce/${address}`,
       );
       
       const nonce = result.nonce;

      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(nonce);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/Auth/login`,
        {
          walletAddress: address,
          signature: signature,
        },
      );

      const newToken = response.data.token;
      localStorage.setItem("jwt_token", newToken);
      setToken(newToken);
      setAccount(address);

      return true;
    } catch (err) {
      console.error("Вхід не вдався", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("jwt_token");
    setToken(null);
    setAccount(null);
    setUserProfile(null);
  };

  return {
    account,
    token,
    loading,
    userProfile,
    setUserProfile,
    loginWithWeb3,
    logout,
  };
};
