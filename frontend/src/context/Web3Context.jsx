import React, { createContext, useContext, useState, useCallback } from "react";
import { BrowserProvider, Contract } from "ethers";
import client from "../api/client";

const Web3Context = createContext(null);

const TOKEN_ADDRESS = import.meta.env.VITE_CREDIT_TOKEN_ADDRESS;
const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function burn(uint256 amount)",
];

// NOTE ON ARCHITECTURE: transfers and retirement (burn) are executed here,
// directly against the smart contract from the project owner's own MetaMask
// wallet. The backend is never asked to move or destroy someone else's
// tokens -- it only *records* the resulting transaction hash afterwards
// (see recordTransaction) so it can show up in the app's history/dashboard.
// If VITE_CREDIT_TOKEN_ADDRESS isn't set yet (no local chain deployed),
// everything still works in an off-chain-simulated mode via the backend
// ledger, so the app is usable before you've run the Hardhat deploy step.

export function Web3Provider({ children }) {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected. Install it from metamask.io to use on-chain transfers.");
      return null;
    }
    setConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAddress(accounts[0]);
      return accounts[0];
    } finally {
      setConnecting(false);
    }
  }, []);

  const getTokenContract = async () => {
    if (!TOKEN_ADDRESS) throw new Error("VITE_CREDIT_TOKEN_ADDRESS is not set — running in off-chain mode.");
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
  };

  const transferOnChain = async (to, amount) => {
    const token = await getTokenContract();
    const tx = await token.transfer(to, amount);
    const receipt = await tx.wait();
    await client.post("/credits/transactions", { type: "Transfer", from: address, to, amount, txHash: receipt.hash });
    return receipt.hash;
  };

  const retireOnChain = async (amount) => {
    const token = await getTokenContract();
    const tx = await token.burn(amount);
    const receipt = await tx.wait();
    await client.post("/credits/transactions", { type: "Retirement", from: address, amount, txHash: receipt.hash });
    return receipt.hash;
  };

  // Off-chain fallback so the app is fully usable before contracts are deployed --
  // records a simulated transaction directly through the backend ledger instead.
  const transferOffChain = async (from, to, amount) => {
    const txHash = `off-chain-${Date.now()}`;
    await client.post("/credits/transactions", { type: "Transfer", from, to, amount, txHash });
    return txHash;
  };
  const retireOffChain = async (from, amount) => {
    const txHash = `off-chain-${Date.now()}`;
    await client.post("/credits/transactions", { type: "Retirement", from, amount, txHash });
    return txHash;
  };

  return (
    <Web3Context.Provider
      value={{
        address,
        connecting,
        connect,
        hasChain: !!TOKEN_ADDRESS,
        transferOnChain,
        retireOnChain,
        transferOffChain,
        retireOffChain,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);
