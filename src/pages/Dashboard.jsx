import Navbar from '../components/Navbar';
import CountdownTimer from '../components/CountdownTimer';
import SlotMachine from '../components/SlotMachine';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { LocalNotifications } from '@capacitor/local-notifications';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [luckyNumber, setLuckyNumber] = useState("");
  const [realWinners, setRealWinners] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState('deposit');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  
  const [historyDate, setHistoryDate] = useState('');
  const [pastResult, setPastResult] = useState(null);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  const navigate = useNavigate();
  const slotMachineRef = useRef();

  useEffect(() => {
    const loadUser = () => {
      const savedUser = JSON.parse(localStorage.getItem('user'));
      if (savedUser) {
        setUserData(savedUser);
        fetchMyTickets(savedUser._id);
      }
    };
    loadUser();
    fetchWinners();

    const setupNotif = async () => {
      try {
        let p = await LocalNotifications.checkPermissions();
        if (p.display !== 'granted') p = await LocalNotifications.requestPermissions();
        if (p.display === 'granted') {
          await LocalNotifications.schedule({
            notifications: [{
              title: "🎁 GGC WIN Alert!",
              body: "Your next reward is just an hour away! Stay tuned for the 11 PM draw. 🎯",
              id: 100, 
              schedule: { allowWhileIdle: true, on: { hour: 22, minute: 0 } },
              sound: null,
              smallIcon: "ic_stat_icon_config_sample"
            }]
          });
        }
      } catch (e) {}
    };
    setupNotif();
  }, []);

  const fetchWinners = async () => {
    try {
      const res = await api.get('/api/ticket/winners/recent');
      setRealWinners(res.data);
    } catch (e) {}
  };

  const fetchMyTickets = async (uid) => {
    try {
      const res = await api.get(`/api/ticket/my-tickets/${uid}?t=${Date.now()}`);
      setMyTickets(res.data);
    } catch (e) {}
  };

  const fetchPastResult = async (date) => {
    if (!date) return;
    setIsFetchingHistory(true);
    try {
      const res = await api.get(`/api/draw/result-by-date?date=${date}`);
      setPastResult(res.data);
    } catch (e) {
      toast.error("Result not found for this date.");
      setPastResult(null);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  // Timer isay call karega raat 11 baje
  const handleTriggerDraw = useCallback(() => {
    if (slotMachineRef.current) slotMachineRef.current.trigger();
  }, []);

  // Jab slot machine apna kaam khatam kar legi toh data refresh hoga
  const onDrawComplete = () => {
    fetchWinners();
    if (userData) fetchMyTickets(userData._id);
  };

  const handleRedeem = async () => {
    if (!voucherCode.trim()) return toast.error("Enter a voucher code!");
    const ld = toast.loading("Verifying...");
    try {
      const res = await api.post('/api/voucher/redeem', { userId: userData._id, code: voucherCode.trim() });
      const u = { ...userData, wallets: { ...userData.wallets, [res.data.walletType || 'reward']: res.data.newBalance } };
      setUserData(u);
      localStorage.setItem('user', JSON.stringify(u));
      toast.success(`Redeemed! $${res.data.amount} added!`, { id: ld });
      setVoucherCode("");
    } catch (e) { toast.error(e.response?.data?.message || "Invalid Voucher!", { id: ld }); }
  };

  const submitEntry = async () => {
    if (isButtonDisabled) return toast.error("⏳ Draw in progress!");
    if (!userData?.wallets) return toast.error("Session expired!");
    if ((userData.wallets[selectedWallet] || 0) < 0.5) return toast.error("Low Balance!");
    if (luckyNumber.length !== 3) return toast.error("Enter 3 digits!");
    const ld = toast.loading("Buying...");
    try {
      const res = await api.post('/api/ticket/buy', { userId: userData._id, ticketNumber: luckyNumber, walletType: selectedWallet, price: 0.5 });
      const u = { ...userData, wallets: { ...userData.wallets, [selectedWallet]: res.data.newBalance } };
      setUserData(u);
      localStorage.setItem('user', JSON.stringify(u));
      toast.success(`Confirmed #${luckyNumber}`, { id: ld });
      setLuckyNumber("");
      fetchMyTickets(userData._id);
    } catch (e) { toast.error("Error occurred!", { id: ld }); }
  };

  const handleTryAgain = async (tNum) => {
    if (isButtonDisabled) return toast.error("⏳ Draw in progress!");
    let wToUse = userData.wallets.deposit >= 0.5 ? 'deposit' : userData.wallets.win >= 0.5 ? 'win' : userData.wallets.reward >= 0.5 ? 'reward' : null;
    if (!wToUse) return toast.error("Insufficient Balance!");
    const ld = toast.loading(`Buying #${tNum}...`);
    try {
      const res = await api.post('/api/ticket/buy', { userId: userData._id, ticketNumber: tNum, walletType: wToUse, price: 0.5 });
      const u = { ...userData, wallets: { ...userData.wallets, [wToUse]: res.data.newBalance } };
      setUserData(u);
      localStorage.setItem('user', JSON.stringify(u));
      toast.success(`Bought #${tNum}!`, { id: ld });
      fetchMyTickets(userData._id);
    } catch (e) { toast.error("Error buying ticket!", { id: ld }); }
  };

  return (
    <div style={styles.container}>
      {/* CSS Styles */}
      <style>{`
        .money-rain-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; overflow: hidden; }
        .money-drop { position: absolute; top: -10%; font-size: 2rem; opacity: 0.5; animation: fallDown linear infinite; }
        @keyframes fallDown { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(360deg); opacity: 0; } }
      `}</style>
      
      {/* Background Money Rain */}
      <div className="money-rain-container">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className="money-drop" style={{ left: `${Math.random() * 100}%`, animationDuration: `${Math.random() * 4 + 3}s`, animationDelay: `${Math.random() * 2}s` }}>💸</div>
        ))}
      </div>
      
      {/* 🎰 Slot Machine Component (Hidden by default, triggers via ref) */}
      <SlotMachine ref={slotMachineRef} onDrawComplete={onDrawComplete} />

      {/* Main UI */}
      <div style={{ width: '100%', position: 'relative', zIndex: 1 }}>
        <Navbar title="GGC WIN" />
        
        {/* ⏰ Timer Component */}
        <div style={{textAlign: 'center', marginTop: '10px'}}>
           <CountdownTimer onLockTickets={setIsButtonDisabled} onTriggerDraw={handleTriggerDraw} />
        </div>
        
        <div style={styles.mainContent}>
          {/* Top Shortcuts */}
          <div style={styles.navBarShortcuts}>
            <button onClick={() => navigate('/history')} style={styles.iconBtn}>📋 History</button>
            <button onClick={() => navigate('/transfer')} style={styles.iconBtn}>💸 Transfer</button>
            <button onClick={() => navigate('/profile')} style={styles.iconBtn}>👤 Profile</button>
            {userData?.role === 'admin' && <button onClick={() => navigate('/admin/dashboard')} style={{...styles.iconBtn, backgroundColor: '#ff4b2b', borderColor: '#ff4b2b', color: 'white', fontWeight: 'bold'}}>👑 Admin</button>}
          </div>

          <div style={styles.heroSection}>
            <h1 style={styles.heroTitle}>YOU ARE LUCKY!</h1>
            <p style={styles.heroSubtitle}>Small Entry. Big WIN, {userData?.username || 'User'}!</p>
          </div>

          <div style={styles.lifetimeCard}>
            <p style={styles.lifetimeLabel}>🏆 TOTAL EARNINGS</p>
            <h1 style={styles.lifetimeAmount}>${Number(userData?.totalEarning || 0).toFixed(2)}</h1>
          </div>
          
          <div style={styles.walletGrid}>
            <div onClick={() => navigate('/history', { state: { filterWallet: 'deposit' } })} style={styles.wCardP}><p style={styles.cLabel}>PLAY BALANCE</p><p style={styles.cAmt}>${Number(userData?.wallets?.deposit || 0).toFixed(2)}</p><button onClick={(e) => { e.stopPropagation(); navigate('/deposit'); }} style={styles.aBtn}>➕ DEPOSIT</button></div>
            <div onClick={() => navigate('/history', { state: { filterWallet: 'win' } })} style={styles.wCardO}><p style={styles.cLabel}>WIN WALLET</p><p style={styles.cAmt}>${Number(userData?.wallets?.win || 0).toFixed(2)}</p><button onClick={(e) => { e.stopPropagation(); navigate('/withdraw'); }} style={styles.aBtn}>💸 WITHDRAW</button></div>
            <div onClick={() => navigate('/history', { state: { filterWallet: 'reward' } })} style={styles.wCardG}><p style={styles.cLabel}>REWARD / BONUS</p><p style={styles.cAmt}>${Number(userData?.wallets?.reward || 0).toFixed(2)}</p><span style={{fontSize: '0.7rem', opacity: 0.8}}>CLICK TO VIEW</span></div>
          </div>

          <div style={styles.promoBox}>
            <h3 style={{ color: '#ffcc33', margin: 0 }}>Got a Promo Code?</h3>
            <input type="text" placeholder="ENTER VOUCHER" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} style={styles.pInput} />
            <button onClick={handleRedeem} style={styles.pBtn}>REDEEM</button>
          </div>

          <div style={styles.bottomGrid}>
            {/* Ticket Buy Section */}
            <div style={styles.tCard}>
              <h2>Pick 3 Digits</h2>
              <select value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)} style={styles.wSel} disabled={isButtonDisabled}>
                <option value="deposit">Play Balance (${Number(userData?.wallets?.deposit || 0).toFixed(2)})</option>
                <option value="win">Win Wallet (${Number(userData?.wallets?.win || 0).toFixed(2)})</option>
                <option value="reward">Reward (${Number(userData?.wallets?.reward || 0).toFixed(2)})</option>
              </select>
              <input type="text" placeholder="000" value={luckyNumber} onChange={(e) => setLuckyNumber(e.target.value.replace(/\D/g, "").slice(0,3))} style={styles.tInp} disabled={isButtonDisabled}/>
              <button onClick={submitEntry} disabled={isButtonDisabled} style={{...styles.pPlay, backgroundColor: isButtonDisabled ? '#555' : '#ff4b2b'}}>{isButtonDisabled ? "⏳ LOCKED" : "BUY TICKET ($0.50)"}</button>
            </div>
            
            {/* My Tickets Section */}
            <div style={styles.iBox}>
              <h3>My Tickets</h3>
              <div style={{maxHeight: '300px', overflowY: 'auto', paddingBottom: '10px'}}>
                {myTickets.length > 0 ? myTickets.map((t, i) => { 
                  let numC = t.status === 'won' ? '#00e676' : t.status === 'lost' || t.status === 'expired' ? '#ff4b2b' : '#ffcc33'; 
                  return (
                    <div key={i} style={styles.tRow}>
                      <div>
                        <span style={{...styles.tNum, color: numC}}>#{t.chosenNumbers[0]}</span>
                        <div style={{fontSize: '0.7rem', opacity: 0.7}}>{new Date(t.createdAt).toLocaleDateString()}</div>
                      </div>
                      {t.status === 'lost' || t.status === 'expired' ? (
                        <button onClick={() => handleTryAgain(t.chosenNumbers[0])} disabled={isButtonDisabled} style={styles.tryBtn}>↻ Try Again</button>
                      ) : <span style={{ fontWeight: 'bold', color: numC }}>{t.status.toUpperCase()}</span>}
                    </div>
                  ); 
                }) : <p style={{opacity: 0.7, textAlign: 'center', marginTop: '20px'}}>No tickets bought.</p>}
              </div>
            </div>
            
            {/* History & Results Section */}
            <div style={styles.iBox}>
              <h3>📅 Past Draw Result</h3>
              <div style={{marginBottom: '10px'}}>
                <input type="date" value={historyDate} onChange={(e) => { setHistoryDate(e.target.value); fetchPastResult(e.target.value); }} style={styles.dInp} />
              </div>
              <div style={styles.hRes}>
                {isFetchingHistory ? <p>Loading...</p> : pastResult?.winningNumber ? (
                  <div style={{width: '100%', display: 'flex', justifyContent: 'space-around', alignItems: 'center'}}>
                    <div style={{textAlign: 'center'}}><p style={{fontSize: '0.75rem', color: '#ffcc33', margin: 0, fontWeight: 'bold'}}>🥇 1st Prize</p><h2 style={{color: '#00e676', margin: '5px 0 0 0', fontSize: '1.8rem'}}>#{pastResult.winningNumber}</h2></div>
                    <div style={{textAlign: 'center'}}><p style={{fontSize: '0.75rem', color: '#C0C0C0', margin: 0, fontWeight: 'bold'}}>🥈 2nd Prize</p><h3 style={{color: 'white', margin: '5px 0 0 0'}}>#{pastResult.secondWinningNumber || '---'}</h3></div>
                    <div style={{textAlign: 'center'}}><p style={{fontSize: '0.75rem', color: '#cd7f32', margin: 0, fontWeight: 'bold'}}>🥉 3rd Prize</p><h3 style={{color: 'white', margin: '5px 0 0 0'}}>#{pastResult.thirdWinningNumber || '---'}</h3></div>
                  </div>
                ) : <p style={{opacity: 0.5, textAlign: 'center'}}>Pick a date to check result.</p>}
              </div>
              <hr style={{opacity: 0.1, margin: '15px 0'}} />
              <h4 style={{marginBottom: '10px', fontSize: '0.9rem'}}>Recent Winners</h4>
              {realWinners.length > 0 ? realWinners.slice(0, 3).map((w, i) => (
                <div key={i} style={styles.wRow}><span>{w.username}</span><b style={{color: '#00e676'}}>${w.prize}</b></div>
              )) : <p style={{opacity:0.5, fontSize: '0.8rem'}}>No winners yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#2e026d', backgroundImage: 'linear-gradient(135deg, #2e026d 0%, #51127c 100%)', color: 'white', minHeight: '100vh', padding: '0 0 50px 0', fontFamily: "'Montserrat', sans-serif" },
  mainContent: { maxWidth: '1100px', margin: '30px auto', padding: '0 15px' },
  navBarShortcuts: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  iconBtn: { padding: '8px 15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white', cursor: 'pointer' },
  heroSection: { textAlign: 'center', marginBottom: '30px' },
  heroTitle: { fontSize: '3rem', fontWeight: '900', margin: '0' },
  heroSubtitle: { fontSize: '1.1rem', opacity: 0.8 },
  lifetimeCard: { background: 'linear-gradient(45deg, #ffcc33, #ffb347)', padding: '20px', borderRadius: '24px', textAlign: 'center', marginBottom: '30px', color: '#5e3a00' },
  lifetimeLabel: { fontSize: '0.9rem', fontWeight: '900' },
  lifetimeAmount: { fontSize: '3rem', fontWeight: '900' },
  walletGrid: { display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap', justifyContent: 'center' },
  wCardP: { flex: '1 1 250px', background: 'linear-gradient(45deg, #11998e, #38ef7d)', padding: '20px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer' },
  wCardO: { flex: '1 1 250px', background: 'linear-gradient(45deg, #f093fb, #f5576c)', padding: '20px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer' },
  wCardG: { flex: '1 1 250px', background: 'linear-gradient(45deg, #fbc02d, #f57f17)', padding: '20px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer' },
  cLabel: { fontSize: '0.8rem', fontWeight: 'bold' },
  cAmt: { fontSize: '1.8rem', fontWeight: '900', margin: '5px 0' },
  aBtn: { padding: '5px 15px', borderRadius: '8px', border: 'none', background: 'rgba(0,0,0,0.2)', color: 'white', cursor: 'pointer', marginTop: '5px' },
  promoBox: { background: 'rgba(255, 255, 255, 0.1)', padding: '20px', borderRadius: '20px', display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '30px', border: '1px dashed #ffcc33' },
  pInput: { padding: '12px', borderRadius: '10px', border: 'none', fontSize: '1rem', fontWeight: 'bold', textAlign: 'center', flex: '1 1 200px' },
  pBtn: { padding: '12px 25px', borderRadius: '10px', border: 'none', backgroundColor: '#00e676', color: '#000', fontWeight: '900', cursor: 'pointer' },
  bottomGrid: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  iBox: { flex: '1 1 280px', background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '20px', boxSizing: 'border-box', width: '100%', overflow: 'hidden' },
  tCard: { flex: '1 1 280px', backgroundColor: '#ffcc33', padding: '25px', borderRadius: '25px', textAlign: 'center', color: '#5e3a00', boxSizing: 'border-box', width: '100%' },
  wSel: { padding: '10px', borderRadius: '10px', width: '100%', marginBottom: '10px', fontSize: '1rem', boxSizing: 'border-box' },
  tInp: { width: '100%', padding: '12px', borderRadius: '10px', fontSize: '2.5rem', textAlign: 'center', marginBottom: '15px', fontWeight: '900', border: '2px solid #5e3a00', boxSizing: 'border-box' },
  pPlay: { width: '100%', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: '900', color: 'white', cursor: 'pointer', fontSize: '1.1rem', boxSizing: 'border-box' },
  tRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', marginBottom: '5px' },
  tNum: { fontSize: '1.2rem', fontWeight: '900' },
  tryBtn: { padding: '5px 10px', borderRadius: '8px', border: '1px solid #ff4b2b', color: '#ffcc33', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' },
  dInp: { width: '100%', padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', outline: 'none' },
  hRes: { padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '15px', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  wRow: { display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', marginBottom: '5px', fontSize: '0.85rem' }
};

export default Dashboard;