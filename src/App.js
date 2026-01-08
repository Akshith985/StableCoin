import React, { useState, useEffect } from 'react';
import './App.css';

// --- SUB-COMPONENT: MINTING PAGE ---
const MintPage = ({ wallet, setWallet }) => {
  const [ethPrice, setEthPrice] = useState(3000);
  const [depositAmount, setDepositAmount] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  // Fake Oracle Price Ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setEthPrice(prev => Math.floor(prev + (Math.random() - 0.5) * 10));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const projectedCollateral = (parseFloat(depositAmount) || 0);
  const projectedDebt = (parseFloat(mintAmount) || 0);
  const healthFactor = projectedDebt > 0 
    ? ((projectedCollateral * ethPrice) / projectedDebt) * 100 
    : 0;

  const handleMint = (e) => {
    e.preventDefault();
    if (!wallet.connected) return alert("Please Connect Wallet Top Right!");
    
    // Simple validation
    if (healthFactor < 150) return alert("Risk too high! Deposit more ETH or mint less USDX.");

    setProcessing(true);
    
    setTimeout(() => {
      // UPDATE GLOBAL WALLET BALANCE
      setWallet(prev => ({
        ...prev,
        ethBalance: prev.ethBalance - projectedCollateral,
        usdxBalance: prev.usdxBalance + projectedDebt
      }));
      setProcessing(false);
      setDepositAmount('');
      setMintAmount('');
      alert(`Success! Minted ${projectedDebt} USDX.`);
    }, 2000);
  };

  return (
    <div className="dashboard-grid">
      <div className="card mint-card">
        <h2>Mint Stablecoin (USDX)</h2>
        <p className="subtitle">Lock ETH to mint USDX.</p>
        <div className="price-ticker">Current ETH Price: <span className="green">${ethPrice}</span></div>
        
        <form onSubmit={handleMint}>
          <div className="input-group">
            <label>Lock Collateral (ETH)</label>
            <div className="input-wrapper">
              <input type="number" placeholder="0.00" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
              <span className="unit">ETH</span>
            </div>
          </div>

          <div className="input-group">
            <label>Mint Stablecoin (USDX)</label>
            <div className="input-wrapper">
              <input type="number" placeholder="0.00" value={mintAmount} onChange={e => setMintAmount(e.target.value)} />
              <span className="unit">USDX</span>
            </div>
          </div>
          
          {mintAmount > 0 && (
            <div className={`health-indicator ${healthFactor < 150 ? 'danger' : 'safe'}`}>
              Health Factor: {healthFactor.toFixed(0)}% {healthFactor < 150 ? "(Risk)" : "(Safe)"}
            </div>
          )}

          <button type="submit" disabled={processing} className={processing ? 'processing' : ''}>
            {processing ? "Minting..." : "Mint USDX"}
          </button>
        </form>
      </div>

      <div className="card guide-card">
        <h3>How it works</h3>
        <p>1. You have <strong>{wallet.ethBalance.toFixed(4)} ETH</strong>.</p>
        <p>2. Try locking <strong>0.1 ETH</strong> to mint <strong>100 USDX</strong>.</p>
        <p>3. Go to "Invoices" to pay for coffee or gigs.</p>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: INVOICE PAGE ---
const InvoicePage = ({ wallet, setWallet }) => {
  // UPDATED: Micro-transaction amounts
  const [invoices, setInvoices] = useState([
    { id: 101, title: "Coffee Subscription", amount: 3.00, status: 'pending' },
    { id: 102, title: "Discord Nitro Gift", amount: 7.50, status: 'pending' },
    { id: 103, title: "Server Hosting (Hr)", amount: 0.85, status: 'pending' }
  ]);
  const [processingId, setProcessingId] = useState(null);

  const payInvoice = (id, amount) => {
    if (!wallet.connected) return alert("Connect Wallet first!");
    
    if (wallet.usdxBalance < amount) {
      alert(`Insufficient Funds! You have ${wallet.usdxBalance.toFixed(2)} USDX but need ${amount.toFixed(2)} USDX.`);
      return;
    }

    setProcessingId(id);
    setTimeout(() => {
      // UPDATE GLOBAL WALLET BALANCE
      setWallet(prev => ({
        ...prev,
        usdxBalance: prev.usdxBalance - amount
      }));

      // Update Invoice Status
      setInvoices(invoices.map(inv => 
        inv.id === id ? { ...inv, status: 'paid' } : inv
      ));
      setProcessingId(null);
    }, 1500);
  };

  return (
    <div className="invoice-container">
      <div className="card balance-card">
        <h3>Available to Spend</h3>
        <div className="big-balance">{wallet.usdxBalance.toFixed(2)} USDX</div>
      </div>

      <div className="invoice-list">
        <h3>Pending Invoices</h3>
        {invoices.map(inv => (
          <div key={inv.id} className={`invoice-item ${inv.status}`}>
            <div className="info">
              <h4>{inv.title}</h4>
              <small>ID: #{inv.id}</small>
            </div>
            <div className="action">
              <span className="amount">${inv.amount.toFixed(2)}</span>
              {inv.status === 'paid' ? (
                <span className="badge paid">PAID</span>
              ) : (
                <button 
                  className="pay-btn" 
                  onClick={() => payInvoice(inv.id, inv.amount)}
                  disabled={!!processingId}
                >
                  {processingId === inv.id ? "Paying..." : "Pay Now"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  const [view, setView] = useState('mint'); // 'mint' or 'invoice'
  const [wallet, setWallet] = useState({ 
    connected: false, 
    address: null, 
    ethBalance: 2.5, // Lowered starting ETH to make it realistic for small users
    usdxBalance: 0   
  });

  const connectWallet = () => {
    setWallet({ ...wallet, connected: true, address: '0x71...9A2' });
  };

  return (
    <div className="app-container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">StableFlow</div>
        <div className="nav-links">
          <button className={view === 'mint' ? 'active' : ''} onClick={() => setView('mint')}>Mint USDX</button>
          <button className={view === 'invoice' ? 'active' : ''} onClick={() => setView('invoice')}>Pay Invoices</button>
        </div>
        <button className={`wallet-btn ${wallet.connected ? 'connected' : ''}`} onClick={connectWallet}>
          {wallet.connected 
            ? `${wallet.usdxBalance.toFixed(2)} USDX | ${wallet.ethBalance.toFixed(4)} ETH` 
            : "Connect Wallet"}
        </button>
      </nav>

      {/* CONTENT */}
      <main>
        {view === 'mint' 
          ? <MintPage wallet={wallet} setWallet={setWallet} /> 
          : <InvoicePage wallet={wallet} setWallet={setWallet} />
        }
      </main>
    </div>
  );
}

export default App;