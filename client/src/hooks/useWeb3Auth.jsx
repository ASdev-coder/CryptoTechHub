import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { ethers } from "ethers";
import { showError } from "../utils/alerts";

const API_URL = import.meta.env.VITE_API_URL + "/api";

export const useWeb3Auth = () => {
  const [account, setAccount] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("jwt_token"));
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem("jwt_token");
    setAccount(null);
    setToken(null);
    setUserProfile(null);
    setIsBlocked(false);
    window.location.href = "/";
  }, []);

  const fetchProfile = useCallback(
    async (currentToken) => {
      if (!currentToken) return;
      try {
        const response = await axios.get(`${API_URL}/Users/profile`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });

        setUserProfile(response.data);

        if (
          response.data.isBlocked === true ||
          response.data.IsBlocked === true
        ) {
          setIsBlocked(true);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        if (err.response?.status === 403) {
          setIsBlocked(true);
        } else if (err.response?.status === 401) {
          logout();
        }
      }
    },
    [logout],
  );

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    }
  }, [token, fetchProfile]);

  const loginWithWeb3 = async () => {
    setLoading(true);
    try {
      if (!window.ethereum) throw new Error("MetaMask не знайдено");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const walletAddress = accounts[0];
      setAccount(walletAddress);

      const nonceRes = await axios.get(
        `${API_URL}/Auth/nonce/${walletAddress}`,
      );
      const nonce = nonceRes.data.nonce;

      const signer = await provider.getSigner();
      const signature = await signer.signMessage(
        `TechChainMarket login: ${nonce}`,
      );

      const loginRes = await axios.post(`${API_URL}/Auth/login`, {
        walletAddress,
        signature,
      });

      const newToken = loginRes.data.token;
      localStorage.setItem("jwt_token", newToken);
      setToken(newToken);

      await fetchProfile(newToken);
    } catch (err) {
      console.error("Login error:", err);
      if (err.response?.status === 403) {
        setIsBlocked(true);
      } else {
        showError(
          "Помилка авторизації",
          err.response?.data?.message || err.message,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    account,
    token,
    loading,
    userProfile,
    isBlocked,
    loginWithWeb3,
    logout,
    setUserProfile,
  };
};
