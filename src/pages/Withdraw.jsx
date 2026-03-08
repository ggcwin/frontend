import React, { useState, useEffect } from 'react';
import api from '../api'; // ✅ axios ki jagah api use kiya
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Withdraw = () => {
  const [userData, setUserData] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('USDT (TRC20)');
  const [accountDetails, setAccountDetails] = useState('');
  const [history, setHistory] = useState([]);
  
  const [fee, setFee] = useState(0);
  const [totalRequired, setTotalRequired] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUserData(savedUser);
      fetchHistory(savedUser._id);
    } else {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const numAmount = Math.floor(Number(amount)) || 0;
    const calculatedFee = numAmount * 0.10; 
    setFee(calculatedFee);
    setTotalRequired(numAmount + calculatedFee);
  }, [amount]);

  const fetchHistory = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      // ✅ Lamba link khatam
      const res = await api.get(`/api/withdraw/history/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
    } catch (err) {
      console.log("Failed to load history");
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const withdrawAmount = Math.floor(Number(amount));
    const finalCost = withdrawAmount + (withdrawAmount * 0.10);

    if (withdrawAmount < 5) return toast.error("Minimum withdrawal is $5.00!");
    if (!accountDetails) return toast.error("Please enter account details!");
    
    const winBalance = userData?.wallets?.win || 0;
    if (winBalance < finalCost) {
      return toast.error(`Insufficient Balance! You need $${finalCost.toFixed(2)} (including 10% fee) to withdraw $${withdrawAmount}.`);
    }

    const loadingToast = toast.loading("Submitting request...");
    try {
      const token = localStorage.getItem('token');
      // ✅ Lamba link khatam
      const res = await api.post('/api/withdraw/request', 
        {
          username: userData.username,
          amount: withdrawAmount,
          method,
          walletAddress: accountDetails
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = { ...userData };
      updatedUser.wallets.win -= finalCost;
      setUserData(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast.success(`Request Submitted! $${finalCost.toFixed(2)} deducted from Win Wallet.`, { id: loadingToast });
      setAmount('');
      setAccountDetails('');
      fetchHistory(userData._id); 
      
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request", { id: loadingToast });
    }
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <h2 style={{margin: 0, color: '#ffcc33', cursor: 'pointer', fontWeight: '900'}} onClick={() => navigate('/dashboard')}>GGC WIN</h2>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>← Back to Dashboard</button>
      </nav>

      <div style={styles.mainContent}>
        <div style={styles.balanceCard}>
          <p style={styles.balanceLabel}>AVAILABLE WIN BALANCE</p>
          <h1 style={styles.balanceAmount}>${Number(userData?.wallets?.win || 0).toFixed(2)}</h1>
        </div>

        <div style={styles.card}>
          <h3 style={{marginBottom: '20px', color: '#ffcc33'}}>💸 Request Withdrawal</h3>
          <form onSubmit={handleWithdraw} style={styles.form}>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Withdrawal Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} style={styles.selectBox}>
                <option value="USDT (TRC20)">USDT (TRC20)</option>
                <option value="JazzCash">JazzCash (Pakistan)</option>
                <option value="Paytm">Paytm / UPI (India)</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Amount to Withdraw ($)</label>
              <input 
                type="number" min="5"
                value={amount} onChange={(e) => setAmount(e.target.value)} 
                style={styles.input} placeholder="Minimum $5.00" 
              />
              
              {amount >= 5 && (
                <div style={styles.feeLedger}>
                    <div style={styles.ledgerRow}>
                        <span>Withdrawal Amount:</span>
                        <span>${Math.floor(amount)}</span>
                    </div>
                    <div style={styles.ledgerRow}>
                        <span style={{color: '#ff4b2b'}}>Service Fee (10%):</span>
                        <span style={{color: '#ff4b2b'}}>+ ${fee.toFixed(2)}</span>
                    </div>
                    <div style={{...styles.ledgerRow, borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '5px', paddingTop: '5px', fontWeight: 'bold'}}>
                        <span>Total Required Balance:</span>
                        <span style={{color: '#00e676'}}>${totalRequired.toFixed(2)}</span>
                    </div>
                </div>
              )}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Account Details</label>
              <input 
                type="text" 
                value={accountDetails} onChange={(e) => setAccountDetails(e.target.value)} 
                style={styles.input} placeholder="Wallet Address or Phone Number" 
              />
            </div>

            <button type="submit" style={styles.withdrawBtn}>SUBMIT REQUEST</button>
          </form>
        </div>

        <div style={styles.card}>
          <h3 style={{marginBottom: '20px'}}>📋 My Withdrawals ({history.length})</h3>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Method</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px', color: '#888'}}>No withdrawal history found.</td></tr>
                ) : (
                  history.map((req, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={styles.td}>{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td style={{...styles.td, color: '#00baf2'}}>{req.method}</td>
                      <td style={{...styles.td, fontWeight: 'bold', color: '#00e676'}}>${Number(req.amount).toFixed(2)}</td>
                      <td style={styles.td}>
                        <span style={
                          req.status === 'approved' ? styles.badgeSuccess : 
                          req.status === 'rejected' ? styles.badgeDanger : 
                          styles.badgeWarning
                        }>
                          {req.status?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#2e026d', backgroundImage: 'linear-gradient(135deg, #2e026d 0%, #51127c 100%)', color: 'white', minHeight: '100vh', paddingBottom: '50px', fontFamily: "'Montserrat', sans-serif" },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 5%', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' },
  backBtn: { backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' },
  mainContent: { maxWidth: '800px', margin: '30px auto', display: 'flex', flexDirection: 'column', gap: '25px', padding: '0 20px' },
  balanceCard: { background: 'linear-gradient(45deg, #f093fb, #f5576c)', padding: '30px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' },
  balanceLabel: { fontSize: '0.9rem', fontWeight: 'bold', opacity: 0.9, letterSpacing: '1px' },
  balanceAmount: { fontSize: '3.5rem', margin: '10px 0 0 0', fontWeight: '900', textShadow: '2px 2px 0px rgba(0,0,0,0.2)' },
  card: { backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(15px)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontWeight: 'bold', fontSize: '0.9rem', color: '#ffcc33' },
  selectBox: { padding: '15px', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', outline: 'none', fontSize: '1rem' },
  input: { padding: '15px', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: 'none', fontSize: '1.1rem', outline: 'none' },
  feeLedger: { marginTop: '5px', padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '12px', fontSize: '0.85rem' },
  ledgerRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '3px' },
  withdrawBtn: { padding: '15px', borderRadius: '12px', backgroundColor: '#ffcc33', color: '#5e3a00', border: 'none', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 5px 0 #cc9900', marginTop: '10px' },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { paddingBottom: '15px', borderBottom: '2px solid rgba(255,255,255,0.1)', color: '#ffcc33', fontSize: '0.9rem' },
  td: { padding: '15px 0', fontSize: '0.9rem' },
  badgeWarning: { backgroundColor: 'rgba(255, 193, 7, 0.2)', color: '#ffc107', padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' },
  badgeSuccess: { backgroundColor: 'rgba(0, 230, 118, 0.2)', color: '#00e676', padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' },
  badgeDanger: { backgroundColor: 'rgba(255, 75, 43, 0.2)', color: '#ff4b2b', padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }
};

export default Withdraw;