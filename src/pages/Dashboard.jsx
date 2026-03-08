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
  const [myTickets, setMyTickets] = useState([]); 
  const [selectedWallet, setSelectedWallet] = useState('deposit'); 
  const [isButtonDisabled, setIsButtonDisabled] = useState(false); 
  
  // 🎰 SLOT MACHINE STATES
  const [showSlotMachine, setShowSlotMachine] = useState(false);
  const [drawStage, setDrawStage] = useState(0); // 1st, 2nd, 3rd Prize
  const [slotDigits, setSlotDigits] = useState(['0', '0', '0']);
  const [finalResults, setFinalResults] = useState([]);

  const navigate = useNavigate();

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

    const timer = setInterval(() => {
      const nowString = new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" });
      const nowPkt = new Date(nowString);
      
      const drawTimePkt = new Date(nowString);
      drawTimePkt.setHours(23, 0, 0, 0); // 11:00 PM PKT
      
      if (nowPkt > drawTimePkt) {
          drawTimePkt.setDate(drawTimePkt.getDate() + 1);
      }
      
      const diff = drawTimePkt - nowPkt;

      // 3 mins pehle button disable
      if (diff <= 180000 && diff > 0) {
          setIsButtonDisabled(true);
      } else {
          setIsButtonDisabled(false);
      }

      // 🚨 EXACTLY 11:00:00 PM PAR SLOT MACHINE TRIGGER KAREIN
      if (nowPkt.getHours() === 23 && nowPkt.getMinutes() === 0 && nowPkt.getSeconds() === 0) {
          triggerSlotMachine();
      }

      const hh = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const mm = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const ss = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setTimeLeft(`${hh}:${mm}:${ss}`);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const fetchWinners = async () => {
      try {
        const res = await api.get('/api/ticket/winners/recent');
        setRealWinners(res.data);
      } catch (err) { console.log("Winners load error"); }
  };

  const fetchMyTickets = async (userId) => {
      try {
          const res = await api.get(`/api/ticket/my-tickets/${userId}`);
          setMyTickets(res.data);
      } catch (err) {}
  };

  // 🎰 ASLI SLOT MACHINE LOGIC
  const triggerSlotMachine = async () => {
      if (showSlotMachine) return; 
      
      // Background Dull karna aur Machine dikhana
      setShowSlotMachine(true);
      setFinalResults([]);

      // Frontend par hi Admin numbers ya Random numbers set karna
      // Yahan hum system ko random generate karne ka backup de rahay hain
      const generatedWinners = [
          Math.floor(Math.random() * 1000).toString().padStart(3, '0'), // 1st
          Math.floor(Math.random() * 1000).toString().padStart(3, '0'), // 2nd
          Math.floor(Math.random() * 1000).toString().padStart(3, '0')  // 3rd
      ];

      // 1️⃣ First Prize Draw
      await runSpin(1, generatedWinners[0]);
      
      // 2️⃣ Second Prize Draw
      await runSpin(2, generatedWinners[1]);
      
      // 3️⃣ Third Prize Draw
      await runSpin(3, generatedWinners[2]);

      // Draw khatam, 4 seconds result dikha kar gayab
      setTimeout(() => {
          setShowSlotMachine(false);
          setDrawStage(0);
          fetchWinners(); // Naye winners load karein
      }, 4000);
  };

  // Ek draw ka 12 second ka spin
  const runSpin = (stageNum, finalNumber) => {
      return new Promise((resolve) => {
          setDrawStage(stageNum);
          
          // Tez spinning animation
          const spinInterval = setInterval(() => {
              setSlotDigits([
                  Math.floor(Math.random() * 10).toString(),
                  Math.floor(Math.random() * 10).toString(),
                  Math.floor(Math.random() * 10).toString()
              ]);
          }, 100); // Har 0.1s mein number badlega

          // Exact 12 seconds baad rokna
          setTimeout(() => {
              clearInterval(spinInterval);
              setSlotDigits(finalNumber.split(''));
              setFinalResults(prev => [...prev, { stage: stageNum, number: finalNumber }]);
              
              // Agle draw se pehle 2 seconds ka gap
              setTimeout(() => {
                  resolve();
              }, 2000);
          }, 12000); // ⏱️ 12 Seconds ki timing
      });
  };

  const submitEntry = async () => {
    if (isButtonDisabled) return toast.error("⏳ Draw is preparing! Purchasing is paused.");
    const fee = 0.5; 

    if (!userData || !userData.wallets) return toast.error("Session expired!");
    if ((userData.wallets[selectedWallet] || 0) < fee) return toast.error("Low Balance!");
    if (luckyNumber.length !== 3) return toast.error("Enter exactly 3 digits!");

    const loadingToast = toast.loading("Processing ticket...");
    try {
      const token = localStorage.getItem('token'); 
      const res = await api.post('/api/ticket/buy', {
        userId: userData._id, ticketNumber: luckyNumber, walletType: selectedWallet, price: fee
      }, { headers: { Authorization: `Bearer ${token}` } });

      const updatedUser = { ...userData, wallets: { ...userData.wallets, [selectedWallet]: res.data.newBalance } };
      setUserData(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success(`Ticket #${luckyNumber} confirmed!`, { id: loadingToast });
      setLuckyNumber(""); 
      fetchMyTickets(userData._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Server error. Try again!", { id: loadingToast });
    }
  };

  return (
    <div style={styles.container}>
      
      {/* 🎰 FULL SCREEN SLOT MACHINE OVERLAY */}
      {showSlotMachine && (
          <div style={styles.slotOverlay}>
              <div style={styles.slotMachineBox}>
                  <h1 style={styles.slotTitle}>
                      {drawStage === 1 ? '🥇 1st PRIZE DRAW' : 
                       drawStage === 2 ? '🥈 2nd PRIZE DRAW' : 
                       drawStage === 3 ? '🥉 3rd PRIZE DRAW' : '🏆 DRAW COMPLETED!'}
                  </h1>

                  <div style={styles.slotWindow}>
                      <div style={styles.slotReel}>{slotDigits[0]}</div>
                      <div style={styles.slotReel}>{slotDigits[1]}</div>
                      <div style={styles.slotReel}>{slotDigits[2]}</div>
                  </div>

                  <p style={styles.slotSubtitle}>System is selecting the lucky numbers...</p>

                  <div style={styles.resultsBoard}>
                      {finalResults.map((res, i) => (
                          <div key={i} style={styles.resultItem}>
                              <span>{res.stage === 1 ? '🥇 1st:' : res.stage === 2 ? '🥈 2nd:' : '🥉 3rd:'}</span>
                              <span style={{color: '#00e676', fontWeight: 'bold'}}>#{res.number}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* BACKGROUND APP (Dull ho jayegi jab overlay active hoga) */}
      <div style={{ filter: showSlotMachine ? 'blur(10px) grayscale(80%)' : 'none', transition: '1s' }}>
          <div className="money-rain">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="money-note" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s` }}>💵</div>
            ))}
          </div>

          <Navbar title="GGC WIN" />
          
          <div style={{textAlign: 'center', marginTop: '10px'}}>
            <span style={styles.timerChip}>Next Draw: {timeLeft}</span>
            {/* 🔴 ADMIN TESTING BUTTON (Sirf admin ko nazar aayega taake woh testing kar sakay bina 11PM wait kiye) */}
            {userData?.role === 'admin' && (
                <button onClick={triggerSlotMachine} style={{marginLeft: '10px', background: 'red', color: 'white', padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer'}}>
                    Test Slot Machine
                </button>
            )}
          </div>

          <div style={styles.mainContent}>
            <div style={styles.navBarShortcuts}>
              <button onClick={() => navigate('/history')} style={styles.iconBtn}>📋 History</button>
              <button onClick={() => navigate('/transfer')} style={styles.iconBtn}>💸 Transfer</button>
              <button onClick={() => navigate('/profile')} style={styles.iconBtn}>👤 Profile</button>
              {userData?.role === 'admin' && <Link to="/admin/dashboard" style={styles.adminLink}>Control</Link>}
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
                    <select value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)} style={styles.walletSelect} disabled={isButtonDisabled}>
                        <option value="deposit">Play Balance (${Number(userData?.wallets?.deposit || 0).toFixed(2)})</option>
                        <option value="win">Win Wallet (${Number(userData?.wallets?.win || 0).toFixed(2)})</option>
                    </select>
                </div>

                <input type="text" placeholder="000" value={luckyNumber} onChange={(e) => setLuckyNumber(e.target.value.replace(/\D/g, "").slice(0,3))} style={styles.ticketInput} disabled={isButtonDisabled}/>
                
                <button onClick={submitEntry} disabled={isButtonDisabled} style={{...styles.playBtn, backgroundColor: isButtonDisabled ? '#555' : '#ff4b2b', color: isButtonDisabled ? '#ccc' : 'white', cursor: isButtonDisabled ? 'not-allowed' : 'pointer', boxShadow: isButtonDisabled ? 'none' : '0 5px 15px rgba(255, 75, 43, 0.4)'}}>
                    {isButtonDisabled ? "⏳ DRAW IN PROGRESS..." : "BUY TICKET ($0.50)"}
                </button>
              </div>

              <div style={styles.infoBox}>
                <h3 style={{color: '#00e676', marginBottom: '15px'}}>🎟️ My Tickets</h3>
                <div style={{maxHeight: '260px', overflowY: 'auto', paddingRight: '5px'}}> 
                    {myTickets.length > 0 ? myTickets.map((t, i) => {
                      let numColor = '#ffcc33'; 
                      if (t.status === 'won') numColor = '#00e676'; 
                      else if (t.status === 'lost') numColor = '#ff4b2b'; 

                      const ticketDate = new Date(t.createdAt || t.raffleDate);
                      const dateStr = ticketDate.toLocaleDateString();
                      const timeStr = ticketDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div key={i} style={styles.ticketRow}>
                           <div>
                              <span style={{...styles.tNumber, color: numColor}}>#{t.chosenNumbers[0]}</span>
                              <div style={{fontSize: '0.75rem', opacity: 0.7, marginTop: '2px'}}>
                                  {dateStr} &nbsp; {timeStr} 
                              </div>
                           </div>
                           <span style={t.status === 'won' ? styles.badgeWon : t.status === 'lost' ? styles.badgeLost : styles.badgePending}>
                              {t.status.toUpperCase()}
                           </span>
                        </div>
                      );
                    }) : <p style={{opacity: 0.5, textAlign: 'center', marginTop: '30px'}}>You haven't bought any tickets yet.</p>}
                </div>
              </div>

            </div>
          </div>
      </div>

      <style>{`
        @keyframes fall { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(360deg); opacity: 0; } }
        .money-note { position: fixed; top: -50px; font-size: 2.5rem; animation: fall 6s linear infinite; z-index: 0; pointer-events: none; }
        .money-rain { position: absolute; width: 100%; height: 100%; overflow: hidden; pointer-events: none; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
};

// Styles
const styles = {
  container: { backgroundColor: '#2e026d', backgroundImage: 'linear-gradient(135deg, #2e026d 0%, #51127c 100%)', color: 'white', minHeight: '100vh', padding: '0 0 50px 0', position: 'relative', overflowX: 'hidden', fontFamily: "'Montserrat', sans-serif" },
  
  // 🎰 SLOT MACHINE STYLES
  slotOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' },
  slotMachineBox: { backgroundColor: '#1a0033', border: '5px solid #ffcc33', borderRadius: '30px', padding: '40px', textAlign: 'center', boxShadow: '0 0 50px rgba(255,204,51,0.5)', minWidth: '350px' },
  slotTitle: { color: '#ffcc33', fontSize: '2rem', fontWeight: '900', marginBottom: '30px', textShadow: '0 2px 10px rgba(255,204,51,0.5)' },
  slotWindow: { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '20px', border: 'inset 5px rgba(255,255,255,0.1)' },
  slotReel: { width: '80px', height: '100px', backgroundColor: 'white', color: '#000', fontSize: '4rem', fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '15px', boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.3)' },
  slotSubtitle: { color: '#00e676', fontSize: '1rem', marginBottom: '30px', fontWeight: 'bold', animation: 'pulse 1s infinite' },
  resultsBoard: { display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '15px' },
  resultItem: { display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', padding: '5px 10px', borderBottom: '1px solid rgba(255,255,255,0.1)' },

  // DASHBOARD STYLES
  timerChip: { backgroundColor: '#ff4b2b', color: 'white', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold' },
  mainContent: { maxWidth: '1100px', margin: '30px auto', position: 'relative', zIndex: 1, padding: '0 20px' },
  navBarShortcuts: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' },
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
  bottomGrid: { display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch' },
  infoBox: { flex: 1, minWidth: '300px', background: 'rgba(255,255,255,0.1)', padding: '25px', borderRadius: '24px', display: 'flex', flexDirection: 'column' },
  winnerRow: { display: 'flex', justifyContent: 'space-between', padding: '12px 15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '10px' },
  ticketCard: { flex: 1, minWidth: '320px', backgroundColor: '#ffcc33', padding: '30px', borderRadius: '30px', textAlign: 'center', border: '5px solid white' },
  selectWrapper: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px', textAlign: 'left', margin: '0 auto 15px' },
  selectLabel: { fontSize: '0.9rem', fontWeight: 'bold', color: '#5e3a00' },
  walletSelect: { padding: '12px', borderRadius: '12px', border: 'none', outline: 'none', fontWeight: 'bold', fontSize: '1rem', color: '#333' },
  ticketInput: { width: '80%', padding: '15px', borderRadius: '15px', border: 'none', fontSize: '2.5rem', textAlign: 'center', fontWeight: 'bold', marginBottom: '25px' },
  playBtn: { width: '100%', padding: '18px', borderRadius: '15px', border: 'none', fontWeight: '900', fontSize: '1.2rem', transition: '0.3s' },
  
  ticketRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', marginBottom: '10px', borderLeft: '4px solid #00baf2' },
  tNumber: { fontSize: '1.3rem', fontWeight: '900', letterSpacing: '2px' },
  badgeWon: { backgroundColor: 'rgba(0, 230, 118, 0.2)', color: '#00e676', padding: '5px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' },
  badgeLost: { backgroundColor: 'rgba(255, 75, 43, 0.2)', color: '#ff4b2b', padding: '5px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' },
  badgePending: { backgroundColor: 'rgba(255, 204, 51, 0.2)', color: '#ffcc33', padding: '5px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }
};

export default Dashboard;