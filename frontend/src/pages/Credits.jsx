import React, { useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import { useWeb3 } from "../context/Web3Context.jsx";

export default function Credits() {
  const { user } = useAuth();
  const { address, connect, hasChain, transferOnChain, retireOnChain, transferOffChain, retireOffChain } = useWeb3();

  const activeAddress = address || user.walletAddress;
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState([]);
  const [xfer, setXfer] = useState({ to: "", amount: "" });
  const [retireAmt, setRetireAmt] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const loadBalance = () => {
    if (!activeAddress) return;
    client.get(`/credits/balance/${activeAddress}`).then((res) => setBalance(res.data.balance));
  };
  const loadTxs = () => client.get("/credits/transactions").then((res) => setTxs(res.data.transactions));

  useEffect(() => { loadBalance(); loadTxs(); }, [activeAddress]);

  const doTransfer = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      if (hasChain) await transferOnChain(xfer.to, Number(xfer.amount));
      else await transferOffChain(activeAddress, xfer.to, Number(xfer.amount));
      setMsg("Transfer complete.");
      setXfer({ to: "", amount: "" });
      loadBalance();
      loadTxs();
    } catch (err) {
      setMsg(err.response?.data?.message || err.message || "Transfer failed");
    } finally {
      setBusy(false);
    }
  };

  const doRetire = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      if (hasChain) await retireOnChain(Number(retireAmt));
      else await retireOffChain(activeAddress, Number(retireAmt));
      setMsg("Credits retired permanently.");
      setRetireAmt("");
      loadBalance();
      loadTxs();
    } catch (err) {
      setMsg(err.response?.data?.message || err.message || "Retirement failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 40 }}>
      <h1>Credits &amp; Wallet</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>
        {hasChain
          ? "Transfers and retirement are signed on-chain by your connected MetaMask wallet."
          : "No chain configured yet — running in off-chain ledger mode (still fully functional for the demo)."}
      </p>

      {!activeAddress && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ marginTop: 0, fontSize: 13 }}>Connect a wallet to see your balance and manage credits.</p>
          <button onClick={connect} className="btn-primary" style={{ fontSize: 12.5 }}>Connect MetaMask</button>
        </div>
      )}

      {activeAddress && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>Wallet</div>
            <div className="mono" style={{ fontSize: 13, marginBottom: 8 }}>{activeAddress}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>Balance</div>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{balance.toLocaleString()} tCO₂e</div>
          </div>

          {msg && <div className="card" style={{ marginBottom: 16, fontSize: 13 }}>{msg}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <form onSubmit={doTransfer} className="card" style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>Transfer credits</div>
              <input required placeholder="To address (0x…)" className="mono" value={xfer.to} onChange={(e) => setXfer({ ...xfer, to: e.target.value })} />
              <input required type="number" min="1" placeholder="Amount" value={xfer.amount} onChange={(e) => setXfer({ ...xfer, amount: e.target.value })} />
              <button disabled={busy} type="submit" className="btn-primary" style={{ fontSize: 12.5 }}>Transfer</button>
            </form>

            <form onSubmit={doRetire} className="card" style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>Retire credits</div>
              <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: 0 }}>Permanently destroys credits to claim the environmental benefit.</p>
              <input required type="number" min="1" placeholder="Amount" value={retireAmt} onChange={(e) => setRetireAmt(e.target.value)} />
              <button disabled={busy} type="submit" className="btn-alert" style={{ fontSize: 12.5 }}>Retire permanently</button>
            </form>
          </div>
        </>
      )}

      <div className="card">
        <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 10 }}>Transaction history</div>
        {txs.length === 0 && <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>No transactions yet.</div>}
        {txs.map((t) => (
          <div key={t._id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderBottom: "1px dashed var(--mist)" }}>
            <span style={{ fontWeight: 600, width: 80 }}>{t.type}</span>
            <span className="mono" style={{ color: "var(--ink-soft)" }}>
              {t.from ? t.from.slice(0, 8) : "contract"} → {t.to ? t.to.slice(0, 8) : "burn"}
            </span>
            <span className="mono" style={{ fontWeight: 600 }}>{t.amount.toLocaleString()} tCO₂e</span>
          </div>
        ))}
      </div>
    </div>
  );
}
