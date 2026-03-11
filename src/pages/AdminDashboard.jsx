import React, { useState, useEffect } from 'react';
import api from '../api'; 
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0, totalSales: 0, totalWithdrawn: 0, pendingWithdrawalsCount: 0, totalDeposit: 0, totalWinners: 0
  });
  const [users, setUsers] = useState([]); 
  
  const [showModal, setShowModal] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [balanceForm, setBalanceForm] = useState({ amount: '', walletType: 'deposit' });

  // ✨ NAYA: Winners Modal State
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [winnersList, setWinnersList] = useState([]);

  const navigate = useNavigate();

  const fetchStatsAndUsers = async () => {
    try {
      const statsRes = await api.get('/api/admin/stats');
      setStats(statsRes.data);
      const usersRes = await api.get('/api/admin/users');
      setUsers(usersRes.data);
    } catch (err) { 
      console.log("Admin data load nahi ho saka", err); 
    }
  };

  useEffect(() => {
    fetchStatsAndUsers();
  }, []);

  const openBalanceModal = (user) => {
    setTargetUser(user);
    setBalanceForm({ amount: '', walletType: 'deposit' });
    setShowModal(true);
  };

  const handleUpdateBalance = async (e) => {
    e.preventDefault();
    if (!balanceForm.amount || balanceForm.amount <= 0) return toast.error("Enter valid amount");

    const loading = toast.loading(`Adding $${balanceForm.amount} to ${targetUser.username}...`);
    try {
      await api.post('/api/admin/update-balance', {
        userId: targetUser._id, amount: balanceForm.amount, walletType: balanceForm.walletType
      });
      toast.success("Balance Updated Successfully!", { id: loading });
      setShowModal(false);
      fetchStatsAndUsers(); 
    } catch (err) {
      toast.error("Failed to update balance.", { id: loading });
    }
  };

  // ✨ NAYA: Fetch Winners and Open Modal
  const openWinnersModal = async () => {
    try {
      const res = await api.get('/api/admin/winners-list');
      setWinnersList(res.data);
      setShowWinnersModal(true);
    } catch (err) {
      toast.error("Failed to load winners list");
    }
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <h2 style={{color: '#ffcc33', margin: 0}}>👑 BOSS DASHBOARD</h2>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>User Mode</button>
      </nav>

      <div style={styles.mainContent}>
        <h1 style={{marginBottom: '30px'}}>Welcome, Boss! 👋</h1>
        
        {/* --- STATS GRID --- */}
        <div style={styles.statsGrid}>
          <div style={{...styles.statCard, borderTop: '5px solid #00baf2'}}>
            <p style={styles.label}>TOTAL USERS</p>
            <h2 style={styles.value}>{stats.totalUsers}</h2>
          </div>
          <div style={{...styles.statCard, borderTop: '5px solid #00e676'}}>
            <p style={styles.label}>TOTAL SALES</p>
            <h2 style={{...styles.value, color: '#00e676'}}>${stats.totalSales}</h2>
          </div>
          <div style={{...styles.statCard, borderTop: '5px solid #f093fb'}}>
            <p style={styles.label}>TOTAL DEPOSIT</p>
            <h2 style={{...styles.value, color: '#f093fb'}}>${stats.totalDeposit}</h2>
          </div>
          <div style={{...styles.statCard, borderTop: '5px solid #ff4b2b'}}>
            <p style={styles.label}>TOTAL WITHDRAWN</p>
            <h2 style={styles.value}>${stats.totalWithdrawn}</h2>
          </div>
          
          {/* ✨ NAYA: TOTAL WINNERS BOX (Clickable) */}
          <div 
            style={{...styles.statCard, borderTop: '5px solid #ffcc33', cursor: 'pointer', transition: '0.3s'}} 
            onClick={openWinnersModal}
            title="Click to view Winners History"
          >
            <p style={styles.label}>TOTAL WINNERS 🏆</p>
            <h2 style={{...styles.value, color: '#ffcc33'}}>{stats.totalWinners}</h2>
            <small style={{color: 'gray', fontSize: '12px'}}>Click to view list</small>
          </div>
        </div>

        {/* --- QUICK ACTIONS --- */}
        <h3 style={{marginTop: '40px', marginBottom: '20px'}}>⚡ Quick Actions</h3>
        <div style={styles.actionGrid}>
          <button onClick={() => navigate('/admin/draw')} style={{...styles.actionBtn, borderColor: '#ff4b2b', backgroundColor: 'rgba(255, 75, 43, 0.1)', color: '#ff4b2b', border: '2px solid #ff4b2b'}}>
            🎯 Ticket Draw (Number Lock 🔒)
          </button>
          <button onClick={() => navigate('/admin/deposits')} style={styles.actionBtn}>💰 Pending Deposits</button>
          <button onClick={() => navigate('/admin/withdrawals')} style={styles.actionBtn}>🏦 Withdrawals</button>
          <button onClick={() => navigate('/history')} style={styles.actionBtn}>📋 Global History</button>
        </div>

        {/* --- PLAYERS TABLE (Aap ka purana code) --- */}
        <h3 style={{marginTop: '50px', marginBottom: '20px', color: '#ffcc33'}}>👥 Players Management</h3>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Username</th>
                <th style={styles.th}>Deposit</th>
                <th style={styles.th}>Win Wallet</th>
                <th style={styles.th}>Total Earned</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={styles.tr}>
                  <td style={styles.td}><b>{u.username}</b> {u.role === 'admin' && '👑'}</td>
                  <td style={styles.td}>${Number(u.wallets?.deposit || 0).toFixed(2)}</td>
                  <td style={{...styles.td, color: '#00e676', fontWeight: 'bold'}}>${Number(u.wallets?.win || 0).toFixed(2)}</td>
                  <td style={{...styles.td, color: '#ffcc33'}}>${Number(u.totalEarning || 0).toFixed(2)}</td>
                  <td style={styles.td}>
                    <button onClick={() => openBalanceModal(u)} style={styles.addMoneyBtn}>➕ Add Fund</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✨ NAYA: WINNERS HISTORY MODAL ✨ */}
      {showWinnersModal && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalBox, maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 style={{color: '#ffcc33', margin: 0}}>🏆 Winners History</h2>
              <button onClick={() => setShowWinnersModal(false)} style={{background: 'none', color: 'red', border: 'none', fontSize: '20px', cursor: 'pointer'}}>✖</button>
            </div>
            
            <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'white'}}>
              <thead>
                <tr>
                  <th style={{padding: '10px', borderBottom: '1px solid #444'}}>Date</th>
                  <th style={{padding: '10px', borderBottom: '1px solid #444'}}>Username</th>
                  <th style={{padding: '10px', borderBottom: '1px solid #444'}}>Winning Amount</th>
                </tr>
              </thead>
              <tbody>
                {winnersList.length > 0 ? winnersList.map(win => (
                  <tr key={win._id}>
                    <td style={{padding: '10px', borderBottom: '1px solid #333'}}>{new Date(win.createdAt).toLocaleDateString()}</td>
                    <td style={{padding: '10px', borderBottom: '1px solid #333', fontWeight: 'bold', color: '#00baf2'}}>{win.userId?.username || 'Unknown'}</td>
                    <td style={{padding: '10px', borderBottom: '1px solid #333', color: '#00e676', fontWeight: 'bold'}}>${win.amount.toFixed(2)}</td>
                  </tr>
                )) : <tr><td colSpan="3" style={{padding: '20px', textAlign: 'center'}}>No winners yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Balance Modal (Aap ka purana code) */}
      {showModal && (
        <div style={styles.modalOverlay}>
            {/* Same old modal code */}
            <div style={styles.modalBox}>
              <h2 style={{color: '#ffcc33', marginBottom: '10px'}}>Add Funds</h2>
              <form onSubmit={handleUpdateBalance} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                <input type="number" required placeholder="Amount" style={styles.modalInput} value={balanceForm.amount} onChange={(e) => setBalanceForm({...balanceForm, amount: e.target.value})} />
                <div style={{display: 'flex', gap: '10px'}}>
                  <button type="submit" style={styles.submitBtn}>Update</button>
                  <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>Cancel</button>
                </div>
              </form>
            </div>
        </div>
      )}
    </div>
  );
};

// ... (Aap ke purane styles same rahenge)
const styles = {
  container: { backgroundColor: '#121212', color: 'white', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif", paddingBottom: '50px' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', backgroundColor: '#1e1e1e', borderBottom: '2px solid #333' },
  backBtn: { background: 'none', border: '1px solid #ffcc33', color: '#ffcc33', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  mainContent: { maxWidth: '1200px', margin: '30px auto', padding: '0 20px' },
  statsGrid: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: '200px', backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '15px', textAlign: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' },
  label: { fontSize: '0.8rem', opacity: 0.6, letterSpacing: '1px', fontWeight: 'bold' },
  value: { fontSize: '2.5rem', margin: '10px 0 0 0' },
  actionGrid: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
  actionBtn: { flex: 1, minWidth: '180px', padding: '15px', borderRadius: '12px', border: '1px solid #333', backgroundColor: '#1e1e1e', color: 'white', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s', fontSize: '1rem', textAlign: 'center' },
  tableContainer: { overflowX: 'auto', backgroundColor: '#1e1e1e', borderRadius: '15px', padding: '15px', border: '1px solid #333' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '15px', borderBottom: '2px solid #333', color: '#ffcc33', fontWeight: 'bold', whiteSpace: 'nowrap' },
  td: { padding: '15px', borderBottom: '1px solid #333', whiteSpace: 'nowrap' },
  tr: { transition: '0.2s hover:bg-[#2a2a2a]' },
  addMoneyBtn: { padding: '8px 12px', backgroundColor: '#00e676', color: '#000', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalBox: { backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '400px', border: '1px solid #ffcc33' },
  modalInput: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #555', backgroundColor: '#2a2a2a', color: 'white', fontSize: '1rem' },
  submitBtn: { flex: 1, padding: '12px', backgroundColor: '#ffcc33', border: 'none', color: '#000', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' },
  cancelBtn: { flex: 1, padding: '12px', backgroundColor: 'transparent', border: '1px solid #ff4b2b', color: '#ff4b2b', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }
};

export default AdminDashboard;