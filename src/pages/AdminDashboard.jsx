import React, { useState, useEffect } from 'react';
import api from '../api'; // Custom api instance for better security
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0, totalSales: 0, totalWithdrawn: 0, pendingWithdrawalsCount: 0
  });
  const [users, setUsers] = useState([]); 
  
  // Balance Update Modal ke states
  const [showModal, setShowModal] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [balanceForm, setBalanceForm] = useState({ amount: '', walletType: 'deposit' });

  const navigate = useNavigate();

  const fetchStatsAndUsers = async () => {
    try {
      // 1. Fetch Stats
      const statsRes = await api.get('/api/admin/stats');
      setStats(statsRes.data);

      // 2. Fetch All Users
      const usersRes = await api.get('/api/admin/users');
      setUsers(usersRes.data);
    } catch (err) { 
      console.log("Admin data load nahi ho saka", err); 
    }
  };

  useEffect(() => {
    fetchStatsAndUsers();
  }, []);

  // Modal Kholne ka function
  const openBalanceModal = (user) => {
    setTargetUser(user);
    setBalanceForm({ amount: '', walletType: 'deposit' });
    setShowModal(true);
  };

  // Balance Add karne ka API call
  const handleUpdateBalance = async (e) => {
    e.preventDefault();
    if (!balanceForm.amount || balanceForm.amount <= 0) return toast.error("Enter valid amount");

    const loading = toast.loading(`Adding $${balanceForm.amount} to ${targetUser.username}...`);
    try {
      await api.post('/api/admin/update-balance', {
        userId: targetUser._id,
        amount: balanceForm.amount,
        walletType: balanceForm.walletType
      });
      
      toast.success("Balance Updated Successfully!", { id: loading });
      setShowModal(false);
      fetchStatsAndUsers(); // List ko dobara refresh karo taake naya balance nazar aaye
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update balance. Backend route check karein!", { id: loading });
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
            <h2 style={styles.value}>${stats.totalSales}</h2>
          </div>
          <div style={{...styles.statCard, borderTop: '5px solid #ff4b2b'}}>
            <p style={styles.label}>TOTAL WITHDRAWN</p>
            <h2 style={styles.value}>${stats.totalWithdrawn}</h2>
          </div>
          <div style={{...styles.statCard, borderTop: '5px solid #ffcc33'}}>
            <p style={styles.label}>PENDING PAYS</p>
            <h2 style={{...styles.value, color: '#ffcc33'}}>{stats.pendingWithdrawalsCount}</h2>
          </div>
        </div>

        {/* --- QUICK ACTIONS --- */}
        <h3 style={{marginTop: '40px', marginBottom: '20px'}}>⚡ Quick Actions</h3>
        <div style={styles.actionGrid}>
          <button onClick={() => navigate('/admin/deposits')} style={{...styles.actionBtn, borderColor: '#00e676'}}>💰 Pending Deposits</button>
          
          {/* ✅ Ye button Admin Draw page par le kar jaye ga jahan "Number Lock" hai */}
          <button 
            onClick={() => navigate('/admin/draw')} 
            style={{...styles.actionBtn, borderColor: '#ff4b2b', backgroundColor: 'rgba(255, 75, 43, 0.1)', color: '#ff4b2b', border: '2px solid #ff4b2b'}}
          >
            🎯 Ticket Draw (Number Lock 🔒)
          </button>
          
          <button onClick={() => navigate('/admin/vouchers')} style={styles.actionBtn}>🎟️ Vouchers</button>
          <button onClick={() => navigate('/admin/withdrawals')} style={styles.actionBtn}>🏦 Withdrawals</button>
          <button onClick={() => navigate('/admin/settings')} style={styles.actionBtn}>⚙️ Settings</button>
          <button onClick={() => navigate('/history')} style={styles.actionBtn}>📋 Global History</button>
        </div>

        {/* --- PLAYERS MANAGEMENT TABLE --- */}
        <h3 style={{marginTop: '50px', marginBottom: '20px', color: '#ffcc33'}}>👥 Players Management</h3>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Username</th>
                <th style={styles.th}>Email</th>
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
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>${Number(u.wallets?.deposit || 0).toFixed(2)}</td>
                  <td style={{...styles.td, color: '#00e676', fontWeight: 'bold'}}>${Number(u.wallets?.win || 0).toFixed(2)}</td>
                  <td style={{...styles.td, color: '#ffcc33'}}>${Number(u.totalEarning || 0).toFixed(2)}</td>
                  <td style={styles.td}>
                    <button onClick={() => openBalanceModal(u)} style={styles.addMoneyBtn}>
                      ➕ Add Fund
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* --- BALANCE UPDATE MODAL --- */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h2 style={{color: '#ffcc33', marginBottom: '10px'}}>Add Funds</h2>
            <p style={{marginBottom: '20px'}}>User: <b>{targetUser?.username}</b></p>
            
            <form onSubmit={handleUpdateBalance} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              <div>
                <label style={styles.modalLabel}>Select Wallet</label>
                <select 
                  style={styles.modalInput}
                  value={balanceForm.walletType} 
                  onChange={(e) => setBalanceForm({...balanceForm, walletType: e.target.value})}
                >
                  <option value="deposit">Deposit Wallet (Play Balance)</option>
                  <option value="win">Win Wallet (Withdrawable)</option>
                  <option value="reward">Reward/Bonus Wallet</option>
                </select>
              </div>
              
              <div>
                <label style={styles.modalLabel}>Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required 
                  placeholder="e.g. 50" 
                  style={styles.modalInput}
                  value={balanceForm.amount} 
                  onChange={(e) => setBalanceForm({...balanceForm, amount: e.target.value})}
                />
              </div>

              <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                <button type="submit" style={styles.submitBtn}>Update Balance</button>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#121212', color: 'white', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif", paddingBottom: '50px' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', backgroundColor: '#1e1e1e', borderBottom: '2px solid #333' },
  backBtn: { background: 'none', border: '1px solid #ffcc33', color: '#ffcc33', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  mainContent: { maxWidth: '1200px', margin: '30px auto', padding: '0 20px' },
  statsGrid: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: '220px', backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '15px', textAlign: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' },
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
  modalLabel: { fontSize: '0.9rem', marginBottom: '5px', display: 'block', color: '#ccc' },
  modalInput: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #555', backgroundColor: '#2a2a2a', color: 'white', fontSize: '1rem' },
  submitBtn: { flex: 1, padding: '12px', backgroundColor: '#ffcc33', border: 'none', color: '#000', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' },
  cancelBtn: { flex: 1, padding: '12px', backgroundColor: 'transparent', border: '1px solid #ff4b2b', color: '#ff4b2b', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }
};

export default AdminDashboard;