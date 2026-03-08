import React, { useState, useEffect } from 'react';
import api from '../api'; 
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminDraw = () => {
  const [tickets, setTickets] = useState([]);
  const [drawForm, setDrawForm] = useState({ winnerId: '', winAmount: '' });
  const navigate = useNavigate();

  const fetchTickets = async () => {
    try {
      const res = await api.get('/api/admin/users'); 
      setTickets(res.data);
    } catch (err) {
      console.log("Failed to load users for draw");
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleAnnounceWinner = async (e) => {
    e.preventDefault();
    if (!drawForm.winnerId || !drawForm.winAmount) return toast.error("Please select a winner and amount!");

    const loading = toast.loading("Processing Winner & Distributing Commissions...");
    try {
      const res = await api.post('/api/ticket/draw', {
        winnerId: drawForm.winnerId,
        winAmount: Number(drawForm.winAmount)
      });
      
      toast.success(res.data.message || "Winner Announced Successfully!", { id: loading });
      setDrawForm({ winnerId: '', winAmount: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to announce winner", { id: loading });
    }
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <h2 style={{ color: '#ffcc33', margin: 0 }}>🏆 TICKET DRAW (WINNER)</h2>
        <button onClick={() => navigate('/admin/dashboard')} style={styles.backBtn}>Back to Dashboard</button>
      </nav>

      <div style={styles.mainContent}>
        <div style={styles.card}>
          <h1 style={{ color: '#00e676', textAlign: 'center', marginBottom: '10px' }}>Announce Daily Winner</h1>
          <p style={{ textAlign: 'center', opacity: 0.8, marginBottom: '30px' }}>
            Select the winner and enter the prize amount. The system will automatically credit the prize to their Win Wallet and send 5% commission to their Sponsor!
          </p>
          
          <form onSubmit={handleAnnounceWinner} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Select Winner (Player)</label>
              <select 
                style={styles.input}
                value={drawForm.winnerId}
                onChange={(e) => setDrawForm({...drawForm, winnerId: e.target.value})}
                required
              >
                <option value="">-- Choose a Player --</option>
                {tickets.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.username} (Earned: ${user.totalEarning || 0})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Prize Amount ($)</label>
              <input 
                type="number" 
                placeholder="e.g. 500" 
                style={styles.input}
                value={drawForm.winAmount}
                onChange={(e) => setDrawForm({...drawForm, winAmount: e.target.value})}
                required
              />
            </div>

            <button type="submit" style={styles.announceBtn}>🎉 ANNOUNCE WINNER & PAY COMMISSIONS</button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#121212', color: 'white', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif" },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', backgroundColor: '#1e1e1e', borderBottom: '2px solid #333' },
  backBtn: { background: 'none', border: '1px solid #ffcc33', color: '#ffcc33', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  mainContent: { maxWidth: '600px', margin: '40px auto', padding: '0 20px' },
  card: { backgroundColor: '#1e1e1e', padding: '40px 30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid #333' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { color: '#ffcc33', fontSize: '0.9rem', fontWeight: 'bold' },
  input: { padding: '15px', borderRadius: '10px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white', fontSize: '1rem', outline: 'none' },
  announceBtn: { padding: '18px', borderRadius: '10px', border: 'none', backgroundColor: '#00e676', color: '#000', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', marginTop: '10px', boxShadow: '0 5px 15px rgba(0, 230, 118, 0.4)' }
};

export default AdminDraw;