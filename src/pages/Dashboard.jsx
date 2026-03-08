import Navbar from '../components/Navbar';
import React, { useEffect, useState } from 'react';
import api from '../api'; 
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [luckyNumber, setLuckyNumber] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [realWinners, setRealWinners] = useState([]);
  
  // 🎯 Wallet Selection State
  const [selectedWallet, setSelectedWallet] = useState('deposit'); 
  
  const navigate = useNavigate();

  useEffect(() => {
    // 🔄 Fresh data fetch karne ke liye function
    const loadUser = () => {
        const savedUser = JSON.parse(localStorage.getItem('user'));
        if (savedUser) setUserData(savedUser);
    };
    loadUser();

    const fetchWinners = async () => {
      try {
        const res = await api.get('/api/ticket/winners/recent');
        setRealWinners(res.data);
      } catch (err) { console.log("Winners load error"); }
    };
    fetchWinners();

    const timer = setInterval(() => {
      const now = new Date();
      const drawTime = new Date();
      drawTime.setHours(23, 0, 0, 0); 
      if (now > drawTime) drawTime.setDate(drawTime.getDate() + 1);
      const diff = drawTime - now;
      const hh = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const mm = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const ss = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setTimeLeft(`${hh}:${mm}:${ss}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const submitEntry = async () => {
    const fee = 0.5; // 🎟️ Ticket Price

    // 🛑 1. Validation Logic
    if (!userData || !userData.wallets) {
        return toast.error("Session expired! Please login again.");
    }

    if ((userData.wallets[selectedWallet] || 0) < fee) {
      toast.error(`Low Balance in ${selectedWallet === 'deposit' ? 'Play Balance' : 'Win Wallet'}!`);
      return;
    }
    
    if (luckyNumber.length !== 3) {
      toast.error("Please enter exactly 3 digits (000-999)!");
      return;
    }

    const loadingToast = toast.loading("Processing ticket...");
    try {
      const token = localStorage.getItem('token'); 

      // 🚀 2. API Call with Auth Header
      const res = await api.post('/api/ticket/buy', {
        userId: userData._id,
        ticketNumber: luckyNumber, 
        walletType: selectedWallet, 
        price: fee
      }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      // ✅ 3. Update UI & LocalStorage with Backend Response
      // Backend se fresh balance lena best practice hai
      const updatedWallets = { ...userData.wallets };
      updatedWallets[selectedWallet] = res.data.newBalance;

      const updatedUser = { ...userData, wallets: updatedWallets };
      
      setUserData(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success(`Ticket #${luckyNumber} confirmed!`, { id: loadingToast });
      setLuckyNumber(""); 
    } catch (err) {
      console.error("Purchase Error:", err);
      const msg = err.response?.data?.message || "Server error. Try again!";
      toast.error(msg, { id: loadingToast });
    }
  };

  // Styles object ko component se bahar rakhna render performance ke liye behtar hota hai
  return (
    <div style={styles.container}>
      <div className="money-rain">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="money-note" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s` }}>💵</div>
        ))}
      </div>

      <Navbar title="GGC WIN" />
      <div style={{textAlign: 'center', marginTop: '10px'}}>
        <span style={styles.timerChip}>Next Draw: {timeLeft}</span>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.navBarShortcuts}>
          <button onClick={() => navigate('/history')} style={styles.iconBtn}>📋 History</button>
          <button onClick={() => navigate('/transfer')} style={styles.iconBtn}>💸 Transfer</button>
          <button onClick={() => navigate('/profile')} style={styles.iconBtn}>👤 Profile</button>
          
          {userData?.role === 'admin' && (
            <Link to="/admin/dashboard" style={styles.adminLink}>
              Control
            </Link>
          )}
        </div>

        <div style={styles.heroSection}>
          <h1 style={styles.heroTitle}>YOU ARE LUCKY!</h1>
          <p style={styles.heroSubtitle}>Try your luck, {userData?.username || 'User'}!</p>
        </div>

        <div style={styles.lifetimeCard}>
          <p style={styles.lifetimeLabel}>🏆 LIFETIME TOTAL EARNINGS</p>
          <h1 style={styles.lifetimeAmount}>${Number(userData?.totalEarning || 0).toFixed(2)}</h1>
        </div>

        <div style={styles.walletGrid}>
          <div style={styles.walletCardPurple}>
            <p style={styles.cardLabel}>PLAY BALANCE</p>
            <p style={styles.cardAmount}>${Number(userData?.wallets?.deposit || 0).toFixed(2)}</p>
            <button onClick={() => navigate('/deposit')} style={styles.actionBtn}>➕ DEPOSIT</button>
          </div>
          <div style={styles.walletCardOrange}>
            <p style={styles.cardLabel}>WIN WALLET</p>
            <p style={styles.cardAmount}>${Number(userData?.wallets?.win || 0).toFixed(2)}</p>
            <button onClick={() => navigate('/withdraw')} style={styles.actionBtn}>💸 WITHDRAW</button>
          </div>
        </div>

        <div style={styles.bottomGrid}>
          <div style={styles.infoBox}>
            <h3 style={{color: '#ffcc33', marginBottom: '15px'}}>🏆 Recent Winners</h3>
            {realWinners.length > 0 ? realWinners.map((w, i) => (
              <div key={i} style={styles.winnerRow}><span>{w.username}</span><b>${w.prize}</b></div>
            )) : <p style={{opacity: 0.5}}>No recent winners yet.</p>}
          </div>

          <div style={styles.ticketCard}>
            <h2 style={{marginBottom: '15px', color: '#5e3a00'}}>Pick 3 Digits</h2>
            
            <div style={styles.selectWrapper}>
                <label style={styles.selectLabel}>Pay From:</label>
                <select 
                    value={selectedWallet} 
                    onChange={(e) => setSelectedWallet(e.target.value)}
                    style={styles.walletSelect}
                >
                    <option value="deposit">Play Balance (${Number(userData?.wallets?.deposit || 0).toFixed(2)})</option>
                    <option value="win">Win Wallet (${Number(userData?.wallets?.win || 0).toFixed(2)})</option>
                </select>
            </div>

            <input 
              type="text" 
              placeholder="000" 
              value={luckyNumber} 
              onChange={(e) => setLuckyNumber(e.target.value.replace(/\D/g, "").slice(0,3))}
              style={styles.ticketInput}
            />
            <button onClick={submitEntry} style={styles.playBtn}>BUY TICKET ($0.50)</button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fall { 
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; } 
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; } 
        }
        .money-note { position: fixed; top: -50px; font-size: 2.5rem; animation: fall 6s linear infinite; z-index: 0; pointer-events: none; }
        .money-rain { position: absolute; width: 100%; height: 100%; overflow: hidden; pointer-events: none; }
      `}</style>
    </div>
  );
};

// Styles object for better organization
const styles = {
  container: { backgroundColor: '#2e026d', backgroundImage: 'linear-gradient(135deg, #2e026d 0%, #51127c 100%)', color: 'white', minHeight: '100vh', padding: '0 20px 50px', position: 'relative', overflowX: 'hidden', fontFamily: "'Montserrat', sans-serif" },
  timerChip: { backgroundColor: '#ff4b2b', color: 'white', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold' },
  mainContent: { maxWidth: '1100px', margin: '30px auto', position: 'relative', zIndex: 1 },
  navBarShortcuts: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px', alignItems: 'center' },
  iconBtn: { padding: '8px 15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', cursor: 'pointer' },
  adminLink: { background: 'red', color: 'white', padding: '10px', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold' },
  heroSection: { textAlign: 'center', marginBottom: '30px' },
  heroTitle: { fontSize: '3rem', fontWeight: '900', margin: '0' },
  heroSubtitle: { fontSize: '1.1rem', opacity: 0.8 },
  lifetimeCard: { background: 'linear-gradient(45deg, #ffcc33, #ffb347)', padding: '25px', borderRadius: '24px', textAlign: 'center', marginBottom: '30px', color: '#5e3a00', border: '3px solid white' },
  lifetimeLabel: { fontSize: '1rem', fontWeight: '900' },
  lifetimeAmount: { fontSize: '3.5rem', fontWeight: '900', margin: '10px 0' },
  walletGrid: { display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' },
  walletCardPurple: { flex: 1, minWidth: '250px', background: 'linear-gradient(45deg, #11998e, #38ef7d)', padding: '25px', borderRadius: '24px', textAlign: 'center' },
  walletCardOrange: { flex: 1, minWidth: '250px', background: 'linear-gradient(45deg, #f093fb, #f5576c)', padding: '25px', borderRadius: '24px', textAlign: 'center' },
  cardLabel: { fontSize: '0.9rem', fontWeight: 'bold' },
  cardAmount: { fontSize: '2.5rem', fontWeight: '900', margin: '10px 0' },
  actionBtn: { padding: '8px 15px', borderRadius: '10px', border: 'none', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  bottomGrid: { display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap' },
  infoBox: { flex: 1, minWidth: '300px', background: 'rgba(255,255,255,0.1)', padding: '25px', borderRadius: '24px' },
  winnerRow: { display: 'flex', justifyContent: 'space-between', padding: '12px 15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '10px' },
  ticketCard: { backgroundColor: '#ffcc33', width: '400px', padding: '30px', borderRadius: '30px', textAlign: 'center', border: '5px solid white' },
  selectWrapper: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px', textAlign: 'left', width: '85%', margin: '0 auto 15px' },
  selectLabel: { fontSize: '0.9rem', fontWeight: 'bold', color: '#5e3a00' },
  walletSelect: { padding: '12px', borderRadius: '12px', border: 'none', outline: 'none', fontWeight: 'bold', fontSize: '1rem', color: '#333', cursor: 'pointer' },
  ticketInput: { width: '80%', padding: '15px', borderRadius: '15px', border: 'none', fontSize: '2.5rem', textAlign: 'center', fontWeight: 'bold', marginBottom: '25px' },
  playBtn: { width: '100%', padding: '18px', borderRadius: '15px', border: 'none', backgroundColor: '#ff4b2b', color: 'white', fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer' }
};

export default Dashboard;