import React, { useState, useEffect } from 'react';
import api from '../api'; 
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminDraw = () => {
  const [unsoldNumbers, setUnsoldNumbers] = useState([]);
  const [totalSold, setTotalSold] = useState(0);
  const [winners, setWinners] = useState(['', '', '']);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 📡 Backend se Unsold Numbers aur Locked Numbers mangwana
  const fetchDrawData = async () => {
    try {
      const res = await api.get('/api/admin/unsold-numbers');
      setUnsoldNumbers(res.data.unsold);
      setTotalSold(res.data.totalSold);

      const settingsRes = await api.get('/api/admin/current-winners');
      if (settingsRes.data.isRigged) {
        setWinners(settingsRes.data.nextWinners);
      }
      setLoading(false);
    } catch (err) {
      toast.error("Failed to load draw data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrawData();
  }, []);

  // 🔒 Winning Numbers Lock karne ka function
  const handleSetWinners = async (e) => {
    e.preventDefault();
    if (winners.some(w => w.length !== 3)) {
      return toast.error("Please enter exactly 3 digits for all prizes!");
    }

    const loadToast = toast.loading("Locking winning numbers...");
    try {
      const res = await api.post('/api/admin/set-winners', { winners });
      toast.success(res.data.message || "Winning numbers locked! 🔒", { id: loadToast });
    } catch (err) {
      toast.error("Failed to lock numbers. Backend check karein!", { id: loadToast });
    }
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <h2 style={{ color: '#ffcc33', margin: 0 }}>🎯 DRAW CONTROL & NUMBER LOCK</h2>
        <button onClick={() => navigate('/admin/dashboard')} style={styles.backBtn}>Back to Dashboard</button>
      </nav>

      <div style={styles.mainContent}>
        
        {/* --- 👑 NUMBER LOCK SECTION --- */}
        <div style={styles.card}>
          <h1 style={{ color: '#ffcc33', textAlign: 'center', marginBottom: '10px' }}>Pre-Select Winners</h1>
          <p style={{ textAlign: 'center', opacity: 0.8, marginBottom: '30px' }}>
            Enter the 3-digit numbers you want the slot machine to announce at 11:00 PM.
          </p>
          
          <form onSubmit={handleSetWinners} style={styles.form}>
            <div style={styles.inputsGrid}>
              {winners.map((val, i) => (
                <div key={i} style={styles.inputGroup}>
                  <label style={styles.label}>{i === 0 ? '🥇 1st Prize' : i === 1 ? '🥈 2nd Prize' : '🥉 3rd Prize'}</label>
                  <input 
                    type="text" 
                    placeholder="000" 
                    style={styles.drawInput}
                    value={val}
                    onChange={(e) => {
                      const newWinners = [...winners];
                      newWinners[i] = e.target.value.replace(/\D/g, '').slice(0, 3);
                      setWinners(newWinners);
                    }}
                    required
                  />
                </div>
              ))}
            </div>
            <button type="submit" style={styles.lockBtn}>🔒 LOCK WINNING NUMBERS</button>
          </form>
        </div>

        {/* --- 📊 UNSOLD NUMBERS RECORD --- */}
        <div style={{...styles.card, marginTop: '30px'}}>
          <h2 style={{color: '#00e676'}}>📊 Unsold Numbers ({unsoldNumbers.length})</h2>
          <p style={{marginBottom: '20px', opacity: 0.8}}>Total Tickets Sold For Next Draw: <b>{totalSold}</b></p>
          
          <div style={styles.numbersBox}>
            {loading ? <p>Loading Numbers...</p> : 
              unsoldNumbers.length > 0 ? unsoldNumbers.map((num, i) => (
                <span key={i} style={styles.badge}>{num}</span>
              )) : <p>No unsold numbers yet.</p>
            }
          </div>
          <p style={{fontSize: '0.8rem', color: '#888', marginTop: '15px'}}>
            * Numbers are automatically removed from this list as users buy tickets.
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#121212', color: 'white', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif" },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', backgroundColor: '#1e1e1e', borderBottom: '2px solid #333' },
  backBtn: { background: 'none', border: '1px solid #ffcc33', color: '#ffcc33', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  mainContent: { maxWidth: '800px', margin: '40px auto', padding: '0 20px' },
  card: { backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid #333' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' },
  label: { color: '#ffcc33', fontSize: '0.9rem', fontWeight: 'bold' },
  drawInput: { padding: '15px', borderRadius: '10px', border: '1px solid #444', backgroundColor: '#000', color: '#ffcc33', fontSize: '2rem', textAlign: 'center', fontWeight: '900', outline: 'none' },
  lockBtn: { padding: '18px', borderRadius: '10px', border: 'none', backgroundColor: '#ff4b2b', color: 'white', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', marginTop: '10px', boxShadow: '0 5px 15px rgba(255, 75, 43, 0.3)' },
  numbersBox: { display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '300px', overflowY: 'auto', backgroundColor: '#000', padding: '15px', borderRadius: '10px', border: '1px solid #333' },
  badge: { backgroundColor: 'rgba(0, 230, 118, 0.1)', color: '#00e676', padding: '4px 8px', borderRadius: '5px', fontSize: '0.85rem', border: '1px solid rgba(0, 230, 118, 0.3)' }
};

export default AdminDraw;