import Navbar from '../components/Navbar';
import React, { useEffect, useState } from 'react';
import api from '../api'; 
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

// ✅ Sound file import (Make sure file exists in src/assets/slot-sound.mp3)
import spinSoundFile from '../assets/slot-sound.mp3';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [luckyNumber, setLuckyNumber] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [realWinners, setRealWinners] = useState([]);
  const [myTickets, setMyTickets] = useState([]); 
  const [selectedWallet, setSelectedWallet] = useState('deposit'); 
  const [isButtonDisabled, setIsButtonDisabled] = useState(false); 
  
  const [showSlotMachine, setShowSlotMachine] = useState(false);
  const [drawStage, setDrawStage] = useState(0); 
  const [slotDigits, setSlotDigits] = useState(['0', '0', '0']);
  const [finalResults, setFinalResults] = useState([]);

  // ✅ Audio Object with local file
  const [spinAudio] = useState(new Audio(spinSoundFile));

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
      drawTimePkt.setHours(23, 0, 0, 0); 
      if (nowPkt > drawTimePkt) drawTimePkt.setDate(drawTimePkt.getDate() + 1);
      const diff = drawTimePkt - nowPkt;

      if (diff <= 180000 && diff > 0) setIsButtonDisabled(true);
      else setIsButtonDisabled(false);

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
      } catch (err) {}
  };

  const fetchMyTickets = async (userId) => {
      try {
          const res = await api.get(`/api/ticket/my-tickets/${userId}`);
          setMyTickets(res.data);
      } catch (err) {}
  };

  const triggerSlotMachine = async () => {
      if (showSlotMachine) return; 
      setShowSlotMachine(true);
      setFinalResults([]);

      // 🎵 Play Sound
      spinAudio.loop = true;
      spinAudio.play().catch(e => console.log("Sound play error:", e));

      // Backup random numbers if admin hasn't set them
      const generatedWinners = [
          Math.floor(Math.random() * 1000).toString().padStart(3, '0'), 
          Math.floor(Math.random() * 1000).toString().padStart(3, '0'), 
          Math.floor(Math.random() * 1000).toString().padStart(3, '0')  
      ];

      await runSpin(1, generatedWinners[0]);
      await runSpin(2, generatedWinners[1]);
      await runSpin(3, generatedWinners[2]);

      setTimeout(() => {
          spinAudio.pause();
          spinAudio.currentTime = 0;
          setShowSlotMachine(false);
          setDrawStage(0);
          fetchWinners(); 
      }, 4000);
  };

  const runSpin = (stageNum, finalNumber) => {
      return new Promise((resolve) => {
          setDrawStage(stageNum);
          const spinInterval = setInterval(() => {
              setSlotDigits([
                  Math.floor(Math.random() * 10).toString(),
                  Math.floor(Math.random() * 10).toString(),
                  Math.floor(Math.random() * 10).toString()
              ]);
          }, 100); 

          // ✅ ⏱️ Reduced to 10 seconds per spin
          setTimeout(() => {
              clearInterval(spinInterval);
              setSlotDigits(finalNumber.split(''));
              setFinalResults(prev => [...prev, { stage: stageNum, number: finalNumber }]);
              setTimeout(() => resolve(), 2000);
          }, 10000); 
      });
  };

  const submitEntry = async () => {
    if (isButtonDisabled) return toast.error("⏳ Draw is preparing!");
    const fee = 0.5; 
    if (!userData || !userData.wallets) return toast.error("Session expired!");
    if ((userData.wallets[selectedWallet] || 0) < fee) return toast.error("Low Balance!");
    if (luckyNumber.length !== 3) return toast.error("Enter exactly 3 digits!");

    const loadingToast = toast.loading("Processing...");
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
      toast.error("Error. Try again!", { id: loadingToast });
    }
  };

  return (
    <div style={styles.container}>
      {showSlotMachine && (
          <div style={styles.slotOverlay}>
              <div style={styles.slotMachineBox}>
                  <h1 style={styles.slotTitle}>
                      {drawStage === 1 ? '🥇 1st PRIZE' : drawStage === 2 ? '🥈 2nd PRIZE' : drawStage === 3 ? '🥉 3rd PRIZE' : '🏆 COMPLETED'}
                  </h1>
                  <div style={styles.slotWindow}>
                      <div style={styles.slotReel}>{slotDigits[0]}</div>
                      <div style={styles.slotReel}>{slotDigits[1]}</div>
                      <div style={styles.slotReel}>{slotDigits[2]}</div>
                  </div>
                  <p style={styles.slotSubtitle}>Spinning Luck...</p>
                  <div style={styles.resultsBoard}>
                      {finalResults.map((res, i) => (
                          <div key={i} style={styles.resultItem}>
                              <span>{res.stage === 1 ? '🥇' : res.stage === 2 ? '🥈' : '🥉'} Prize:</span>
                              <span style={{color: '#00e676', fontWeight: 'bold'}}>#{res.number}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      <div style={{ filter: showSlotMachine ? 'blur(10px) grayscale(80%)' : 'none', transition: '1s' }}>
          <Navbar title="GGC WIN" />
          <div style={{textAlign: 'center', marginTop: '10px'}}>
            <span style={styles.timerChip}>Next Draw: {timeLeft}</span>
            {userData?.role === 'admin' && <button onClick={triggerSlotMachine} style={styles.testBtn}>Test Slot Machine</button>}
          </div>
          <div style={styles.mainContent}>
            <div style={styles.navBarShortcuts}>
              <button onClick={() => navigate('/history')} style={styles.iconBtn}>📋 History</button>
              <button onClick={() => navigate('/transfer')} style={styles.iconBtn}>💸 Transfer</button>
              <button onClick={() => navigate('/profile')} style={styles.iconBtn}>👤 Profile</button>
              {userData?.role === 'admin' && <Link to="/admin/dashboard" style={styles.adminLink}>Control</Link>}
            </div>
            <div style={styles.lifetimeCard}><p style={styles.lifetimeLabel}>🏆 TOTAL EARNINGS</p><h1 style={styles.lifetimeAmount}>${Number(userData?.totalEarning || 0).toFixed(2)}</h1></div>
            <div style={styles.walletGrid}>
              <div style={styles.walletCardPurple}><p style={styles.cardLabel}>PLAY BALANCE</p><p style={styles.cardAmount}>${Number(userData?.wallets?.deposit || 0).toFixed(2)}</p><button onClick={() => navigate('/deposit')} style={styles.actionBtn}>➕ DEPOSIT</button></div>
              <div style={styles.walletCardOrange}><p style={styles.cardLabel}>WIN WALLET</p><p style={styles.cardAmount}>${Number(userData?.wallets?.win || 0).toFixed(2)}</p><button onClick={() => navigate('/withdraw')} style={styles.actionBtn}>💸 WITHDRAW</button></div>
            </div>
            <div style={styles.bottomGrid}>
              <div style={styles.infoBox}><h3 style={{color: '#ffcc33', marginBottom: '15px'}}>🏆 Recent Winners</h3>{realWinners.map((w, i) => (<div key={i} style={styles.winnerRow}><span>{w.username}</span><b>${w.prize}</b></div>))}</div>
              <div style={styles.ticketCard}>
                <h2 style={{marginBottom: '15px', color: '#5e3a00'}}>Pick 3 Digits</h2>
                <div style={styles.selectWrapper}><label style={styles.selectLabel}>Pay From:</label><select value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)} style={styles.walletSelect} disabled={isButtonDisabled}><option value="deposit">Play Balance</option><option value="win">Win Wallet</option></select></div>
                <input type="text" placeholder="000" value={luckyNumber} onChange={(e) => setLuckyNumber(e.target.value.replace(/\D/g, "").slice(0,3))} style={styles.ticketInput} disabled={isButtonDisabled}/>
                <button onClick={submitEntry} disabled={isButtonDisabled} style={{...styles.playBtn, backgroundColor: isButtonDisabled ? '#555' : '#ff4b2b'}}>{isButtonDisabled ? "⏳ PAUSED" : "BUY TICKET ($0.50)"}</button>
              </div>
              <div style={styles.infoBox}><h3 style={{color: '#00e676', marginBottom: '15px'}}>🎟️ My Tickets</h3><div style={{maxHeight: '260px', overflowY: 'auto'}}>{myTickets.map((t, i) => {
                  let numColor = t.status === 'won' ? '#00e676' : t.status === 'lost' ? '#ff4b2b' : '#ffcc33';
                  const tDate = new Date(t.createdAt || t.raffleDate);
                  return (<div key={i} style={styles.ticketRow}><div><span style={{...styles.tNumber, color: numColor}}>#{t.chosenNumbers[0]}</span><div style={{fontSize: '0.75rem', opacity: 0.7}}>{tDate.toLocaleDateString()} {tDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div></div><span style={t.status === 'won' ? styles.badgeWon : t.status === 'lost' ? styles.badgeLost : styles.badgePending}>{t.status.toUpperCase()}</span></div>);
              })}</div></div>
            </div>
          </div>
      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#2e026d', backgroundImage: 'linear-gradient(135deg, #2e026d 0%, #51127c 100%)', color: 'white', minHeight: '100vh', padding: '0 0 50px 0', position: 'relative', overflowX: 'hidden', fontFamily: "'Montserrat', sans-serif" },
  slotOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' },
  slotMachineBox: { backgroundColor: '#1a0033', border: '5px solid #ffcc33', borderRadius: '30px', padding: '40px', textAlign: 'center', boxShadow: '0 0 50px rgba(255,204,51,0.5)', minWidth: '350px' },
  slotTitle: { color: '#ffcc33', fontSize: '1.8rem', fontWeight: '900', marginBottom: '20px' },
  slotWindow: { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '20px' },
  slotReel: { width: '70px', height: '90px', backgroundColor: 'white', color: '#000', fontSize: '3.5rem', fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '12px' },
  slotSubtitle: { color: '#00e676', fontSize: '1rem', marginBottom: '20px', fontWeight: 'bold' },
  resultsBoard: { display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '15px' },
  resultItem: { display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  timerChip: { backgroundColor: '#ff4b2b', color: 'white', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold' },
  testBtn: { marginLeft: '10px', background: 'red', color: 'white', padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer' },
  mainContent: { maxWidth: '1100px', margin: '30px auto', position: 'relative', zIndex: 1, padding: '0 20px' },
  navBarShortcuts: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' },
  iconBtn: { padding: '8px 15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', cursor: 'pointer' },
  adminLink: { background: 'red', color: 'white', padding: '10px', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold' },
  lifetimeCard: { background: 'linear-gradient(45deg, #ffcc33, #ffb347)', padding: '25px', borderRadius: '24px', textAlign: 'center', marginBottom: '30px', color: '#5e3a00', border: '3px solid white' },
  lifetimeLabel: { fontSize: '1rem', fontWeight: '900' },
  lifetimeAmount: { fontSize: '3.5rem', fontWeight: '900' },
  walletGrid: { display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' },
  walletCardPurple: { flex: 1, minWidth: '250px', background: 'linear-gradient(45deg, #11998e, #38ef7d)', padding: '25px', borderRadius: '24px', textAlign: 'center' },
  walletCardOrange: { flex: 1, minWidth: '250px', background: 'linear-gradient(45deg, #f093fb, #f5576c)', padding: '25px', borderRadius: '24px', textAlign: 'center' },
  cardLabel: { fontSize: '0.9rem', fontWeight: 'bold' },
  cardAmount: { fontSize: '2.5rem', fontWeight: '900' },
  actionBtn: { padding: '8px 15px', borderRadius: '10px', border: 'none', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  bottomGrid: { display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap' },
  infoBox: { flex: 1, minWidth: '300px', background: 'rgba(255,255,255,0.1)', padding: '25px', borderRadius: '24px' },
  winnerRow: { display: 'flex', justifyContent: 'space-between', padding: '12px 15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '10px' },
  ticketCard: { flex: 1, minWidth: '320px', backgroundColor: '#ffcc33', padding: '30px', borderRadius: '30px', textAlign: 'center', border: '5px solid white' },
  selectWrapper: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' },
  selectLabel: { fontSize: '0.9rem', fontWeight: 'bold', color: '#5e3a00' },
  walletSelect: { padding: '12px', borderRadius: '12px', border: 'none', outline: 'none', fontWeight: 'bold', fontSize: '1rem' },
  ticketInput: { width: '80%', padding: '15px', borderRadius: '15px', border: 'none', fontSize: '2.5rem', textAlign: 'center', fontWeight: 'bold', marginBottom: '25px' },
  playBtn: { width: '100%', padding: '18px', borderRadius: '15px', border: 'none', fontWeight: '900', fontSize: '1.2rem', color: 'white' },
  ticketRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', marginBottom: '10px', borderLeft: '4px solid #00baf2' },
  tNumber: { fontSize: '1.3rem', fontWeight: '900', letterSpacing: '2px' },
  badgeWon: { backgroundColor: 'rgba(0, 230, 118, 0.2)', color: '#00e676', padding: '5px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' },
  badgeLost: { backgroundColor: 'rgba(255, 75, 43, 0.2)', color: '#ff4b2b', padding: '5px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' },
  badgePending: { backgroundColor: 'rgba(255, 204, 51, 0.2)', color: '#ffcc33', padding: '5px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }
};

export default Dashboard;