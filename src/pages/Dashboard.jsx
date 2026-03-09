import Navbar from '../components/Navbar';
import React, { useEffect, useState } from 'react';
import api from '../api'; 
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import spinSoundFile from '../assets/slot-sound.mp3';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [luckyNumber, setLuckyNumber] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [realWinners, setRealWinners] = useState([]);
  const [myTickets, setMyTickets] = useState([]); 
  const [selectedWallet, setSelectedWallet] = useState('deposit'); 
  const [isButtonDisabled, setIsButtonDisabled] = useState(false); 
  
  const [voucherCode, setVoucherCode] = useState("");
  
  const [showSlotMachine, setShowSlotMachine] = useState(false);
  const [drawStage, setDrawStage] = useState(0); 
  const [slotDigits, setSlotDigits] = useState(['0', '0', '0']);
  const [finalResults, setFinalResults] = useState([]);

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
      const now = new Date();
      
      const pktString = now.toLocaleString("en-US", { timeZone: "Asia/Karachi" });
      const currentPktTime = new Date(pktString);
      
      const targetPktTime = new Date(pktString);
      targetPktTime.setHours(23, 0, 0, 0);

      if (currentPktTime.getTime() >= targetPktTime.getTime()) {
          targetPktTime.setDate(targetPktTime.getDate() + 1);
      }

      const diff = targetPktTime.getTime() - currentPktTime.getTime();

      if (diff <= 180000 && diff > 0) {
          setIsButtonDisabled(true);
      } else {
          setIsButtonDisabled(false);
      }

      if (currentPktTime.getHours() === 23 && currentPktTime.getMinutes() === 0 && currentPktTime.getSeconds() === 0) {
          triggerSlotMachine();
      }

      const hh = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const mm = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      const ss = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
      
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
      spinAudio.loop = true;
      spinAudio.play().catch(e => console.log("Sound error", e));

      let generatedWinners = [];
      try {
          const res = await api.get('/api/admin/current-winners');
          if (res.data && res.data.isRigged) {
              generatedWinners = res.data.nextWinners; 
          } else {
              generatedWinners = [
                  Math.floor(Math.random() * 1000).toString().padStart(3, '0'), 
                  Math.floor(Math.random() * 1000).toString().padStart(3, '0'), 
                  Math.floor(Math.random() * 1000).toString().padStart(3, '0')  
              ];
          }
      } catch (err) {
          generatedWinners = [
              Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
              Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
              Math.floor(Math.random() * 1000).toString().padStart(3, '0')
          ];
      }

      await runSpin(1, generatedWinners[0]);
      await runSpin(2, generatedWinners[1]);
      await runSpin(3, generatedWinners[2]);

      setTimeout(() => {
          spinAudio.pause(); spinAudio.currentTime = 0;
          setShowSlotMachine(false);
          setDrawStage(0);
          fetchWinners(); 
      }, 4000);
  };

  const runSpin = (stageNum, finalNumber) => {
      return new Promise((resolve) => {
          setDrawStage(stageNum);
          const spinInterval = setInterval(() => {
              setSlotDigits([Math.floor(Math.random() * 10).toString(), Math.floor(Math.random() * 10).toString(), Math.floor(Math.random() * 10).toString()]);
          }, 100); 

          setTimeout(() => {
              clearInterval(spinInterval);
              setSlotDigits(finalNumber.split(''));
              setFinalResults(prev => [...prev, { stage: stageNum, number: finalNumber }]);
              setTimeout(() => resolve(), 2000);
          }, 10000); 
      });
  };

  const handleRedeemVoucher = async () => {
    if (!voucherCode.trim()) return toast.error("Please enter a voucher code!");
    
    const loadingToast = toast.loading("Verifying Voucher...");
    try {
        const token = localStorage.getItem('token');
        const res = await api.post('/api/voucher/redeem', {
            userId: userData._id,
            code: voucherCode.trim()
        }, { headers: { Authorization: `Bearer ${token}` } });

        const updatedUser = { 
            ...userData, 
            wallets: {
                ...userData.wallets,
                [res.data.walletType || 'reward']: res.data.newBalance
            } 
        };
        
        setUserData(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        toast.success(`🎉 Voucher Redeemed! $${res.data.amount} added!`, { id: loadingToast });
        setVoucherCode(""); 
        
    } catch (err) {
        toast.error(err.response?.data?.message || "Invalid Voucher!", { id: loadingToast });
    }
  };

  const submitEntry = async () => {
    if (isButtonDisabled) return toast.error("⏳ Draw in progress!");
    const fee = 0.5; 
    if (!userData?.wallets) return toast.error("Session expired!");
    if ((userData.wallets[selectedWallet] || 0) < fee) return toast.error("Low Balance!");
    if (luckyNumber.length !== 3) return toast.error("Enter 3 digits!");

    const loadingToast = toast.loading("Processing...");
    try {
      const token = localStorage.getItem('token'); 
      const res = await api.post('/api/ticket/buy', {
        userId: userData._id, ticketNumber: luckyNumber, walletType: selectedWallet, price: fee
      }, { headers: { Authorization: `Bearer ${token}` } });

      const updatedUser = { ...userData, wallets: { ...userData.wallets, [selectedWallet]: res.data.newBalance } };
      setUserData(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success(`Confirmed #${luckyNumber}`, { id: loadingToast });
      setLuckyNumber(""); 
      fetchMyTickets(userData._id);
    } catch (err) {
      toast.error("Error occurred!", { id: loadingToast });
    }
  };

  const handleTryAgain = async (ticketNumber) => {
      if (isButtonDisabled) return toast.error("⏳ Draw in progress!");
      const fee = 0.5;
      if (!userData?.wallets) return toast.error("Session expired!");

      let walletToUse = null;
      if (userData.wallets.deposit >= fee) {
          walletToUse = 'deposit';
      } else if (userData.wallets.win >= fee) {
          walletToUse = 'win';
      } else if (userData.wallets.reward >= fee) {
          walletToUse = 'reward';
      }

      if (!walletToUse) return toast.error("Insufficient Balance in all wallets!");

      const loadingToast = toast.loading(`Auto-buying #${ticketNumber}...`);
      try {
          const token = localStorage.getItem('token');
          const res = await api.post('/api/ticket/buy', {
              userId: userData._id, 
              ticketNumber: ticketNumber, 
              walletType: walletToUse, 
              price: fee
          }, { headers: { Authorization: `Bearer ${token}` } });

          const updatedUser = { ...userData, wallets: { ...userData.wallets, [walletToUse]: res.data.newBalance } };
          setUserData(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          toast.success(`Bought #${ticketNumber} from ${walletToUse.toUpperCase()}!`, { id: loadingToast });
          fetchMyTickets(userData._id); 
      } catch (err) {
          toast.error("Error buying ticket!", { id: loadingToast });
      }
  };

  return (
    <div style={styles.container}>
      {showSlotMachine && (
          <div style={styles.slotOverlay}>
              <div style={styles.slotMachineBox}>
                  <h1 style={styles.slotTitle}>{drawStage === 1 ? '🥇 1st' : drawStage === 2 ? '🥈 2nd' : '🥉 3rd'} Prize</h1>
                  <div style={styles.slotWindow}>
                      {slotDigits.map((d, i) => <div key={i} style={styles.slotReel}>{d}</div>)}
                  </div>
                  <p style={styles.slotSubtitle}>Spinning Luck...</p>
                  <div style={styles.resultsBoard}>
                      {finalResults.map((res, i) => (<div key={i} style={styles.resultItem}><span>{res.stage} Prize:</span><span style={{color: '#00e676'}}>#{res.number}</span></div>))}
                  </div>
              </div>
          </div>
      )}

      <div style={{ filter: showSlotMachine ? 'blur(10px) grayscale(80%)' : 'none', transition: '1s', width: '100%' }}>
          <Navbar title="GGC WIN" />
          <div style={{textAlign: 'center', marginTop: '10px'}}><span style={styles.timerChip}>Next Draw: {timeLeft}</span></div>
          
          <div style={styles.mainContent}>
            <div style={styles.navBarShortcuts}>
              <button onClick={() => navigate('/history')} style={styles.iconBtn}>📋 History</button>
              <button onClick={() => navigate('/transfer')} style={styles.iconBtn}>💸 Transfer</button>
              <button onClick={() => navigate('/profile')} style={styles.iconBtn}>👤 Profile</button>
              {userData?.role === 'admin' && (
                  <button onClick={() => navigate('/admin/dashboard')} style={{...styles.iconBtn, backgroundColor: '#ff4b2b', borderColor: '#ff4b2b', color: 'white', fontWeight: 'bold'}}>👑 Admin</button>
              )}
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
              <div onClick={() => navigate('/history', { state: { filterWallet: 'deposit' } })} style={{...styles.walletCardPurple, cursor: 'pointer'}}>
                <p style={styles.cardLabel}>PLAY BALANCE</p>
                <p style={styles.cardAmount}>${Number(userData?.wallets?.deposit || 0).toFixed(2)}</p>
                <button onClick={(e) => { e.stopPropagation(); navigate('/deposit'); }} style={styles.actionBtn}>➕ DEPOSIT</button>
              </div>

              <div onClick={() => navigate('/history', { state: { filterWallet: 'win' } })} style={{...styles.walletCardOrange, cursor: 'pointer'}}>
                <p style={styles.cardLabel}>WIN WALLET</p>
                <p style={styles.cardAmount}>${Number(userData?.wallets?.win || 0).toFixed(2)}</p>
                <button onClick={(e) => { e.stopPropagation(); navigate('/withdraw'); }} style={styles.actionBtn}>💸 WITHDRAW</button>
              </div>
              
              <div onClick={() => navigate('/history', { state: { filterWallet: 'reward' } })} style={{...styles.walletCardGold, cursor: 'pointer'}}>
                <p style={styles.cardLabel}>REWARD / BONUS</p>
                <p style={styles.cardAmount}>${Number(userData?.wallets?.reward || 0).toFixed(2)}</p>
                <span style={{fontSize: '0.7rem', opacity: 0.8}}>CLICK TO VIEW HISTORY</span>
              </div>
            </div>

            <div style={styles.promoBox}>
                <h3 style={{ color: '#ffcc33', margin: 0, fontSize: '1.2rem' }}>Got a Promo Code?</h3>
                <input 
                    type="text" 
                    placeholder="ENTER VOUCHER" 
                    value={voucherCode} 
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} 
                    style={styles.promoInput} 
                />
                <button onClick={handleRedeemVoucher} style={styles.promoBtn}>REDEEM</button>
            </div>

            <div style={styles.bottomGrid}>
              <div style={styles.ticketCard}>
                <h2>Pick 3 Digits</h2>
                <div style={styles.selectWrapper}>
                    {/* ✅ NAYA: Dropdown mein Live Balance Show Hoga */}
                    <select value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)} style={styles.walletSelect} disabled={isButtonDisabled}>
                        <option value="deposit">Play Balance (${Number(userData?.wallets?.deposit || 0).toFixed(2)})</option>
                        <option value="win">Win Wallet (${Number(userData?.wallets?.win || 0).toFixed(2)})</option>
                        <option value="reward">Reward (${Number(userData?.wallets?.reward || 0).toFixed(2)})</option>
                    </select>
                </div>
                <input type="text" placeholder="000" value={luckyNumber} onChange={(e) => setLuckyNumber(e.target.value.replace(/\D/g, "").slice(0,3))} style={styles.ticketInput} disabled={isButtonDisabled}/>
                <button onClick={submitEntry} disabled={isButtonDisabled} style={{...styles.playBtn, backgroundColor: isButtonDisabled ? '#555' : '#ff4b2b'}}>{isButtonDisabled ? "⏳ PAUSED (Draw Time)" : "BUY TICKET ($0.50)"}</button>
              </div>
              
              <div style={styles.infoBox}>
                <h3>My Tickets</h3>
                <div style={{maxHeight: '300px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '10px'}}>
                    {myTickets.length > 0 ? myTickets.map((t, i) => {
                        let numC = t.status === 'won' ? '#00e676' : t.status === 'lost' || t.status === 'expired' ? '#ff4b2b' : '#ffcc33';
                        const d = new Date(t.createdAt);
                        return (
                        <div key={i} style={styles.ticketRow}>
                            <div>
                                <span style={{...styles.tNumber, color: numC}}>#{t.chosenNumbers[0]}</span>
                                <div style={{fontSize: '0.7rem', opacity: 0.7}}>{d.toLocaleDateString()} {d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                            </div>
                            
                            {t.status === 'lost' || t.status === 'expired' ? (
                                <button 
                                    onClick={() => handleTryAgain(t.chosenNumbers[0])}
                                    disabled={isButtonDisabled}
                                    style={{...styles.tryAgainBtn, opacity: isButtonDisabled ? 0.5 : 1}}
                                >
                                    ↻ Try Again
                                </button>
                            ) : (
                                <span style={{ fontWeight: 'bold', color: numC }}>{t.status.toUpperCase()}</span>
                            )}
                        </div>
                        );
                    }) : <p style={{opacity: 0.7, textAlign: 'center', marginTop: '20px'}}>No tickets bought yet.</p>}
                </div>
              </div>
              
              <div style={styles.infoBox}>
                  <h3>Recent Winners</h3>
                  {realWinners.length > 0 ? realWinners.map((w, i) => (
                      <div key={i} style={styles.winnerRow}>
                          <span>{w.username}</span>
                          <b style={{color: '#00e676'}}>${w.prize}</b>
                      </div>
                  )) : <p style={{opacity: 0.7, textAlign: 'center', marginTop: '20px'}}>Waiting for today's draw...</p>}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#2e026d', backgroundImage: 'linear-gradient(135deg, #2e026d 0%, #51127c 100%)', color: 'white', minHeight: '100vh', padding: '0 0 50px 0', overflowX: 'hidden', fontFamily: "'Montserrat', sans-serif", boxSizing: 'border-box' },
  slotOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' },
  slotMachineBox: { backgroundColor: '#1a0033', border: '5px solid #ffcc33', borderRadius: '30px', padding: '40px', textAlign: 'center', width: '90%', maxWidth: '350px', boxSizing: 'border-box' },
  slotTitle: { color: '#ffcc33', fontSize: '1.8rem', marginBottom: '20px' },
  slotWindow: { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px' },
  slotReel: { width: '60px', height: '80px', backgroundColor: 'white', color: '#000', fontSize: '3rem', fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '10px' },
  slotSubtitle: { color: '#00e676', fontSize: '1rem', marginBottom: '20px' },
  resultsBoard: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px' },
  resultItem: { display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' },
  timerChip: { backgroundColor: '#ff4b2b', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold' },
  mainContent: { maxWidth: '1100px', margin: '30px auto', padding: '0 15px', boxSizing: 'border-box', width: '100%', overflowX: 'hidden' },
  navBarShortcuts: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  iconBtn: { padding: '8px 15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white', cursor: 'pointer' },
  heroSection: { textAlign: 'center', marginBottom: '30px' },
  heroTitle: { fontSize: '3rem', fontWeight: '900', margin: '0', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' },
  heroSubtitle: { fontSize: '1.2rem', opacity: 0.9, marginTop: '5px' },
  lifetimeCard: { background: 'linear-gradient(45deg, #ffcc33, #ffb347)', padding: '25px', borderRadius: '24px', textAlign: 'center', marginBottom: '30px', color: '#5e3a00', boxSizing: 'border-box' },
  lifetimeLabel: { fontSize: '1rem', fontWeight: '900' },
  lifetimeAmount: { fontSize: '3.5rem', fontWeight: '900' },
  walletGrid: { display: 'flex', gap: '15px', marginBottom: '40px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' },
  walletCardPurple: { flex: '1 1 250px', background: 'linear-gradient(45deg, #11998e, #38ef7d)', padding: '20px', borderRadius: '20px', textAlign: 'center', transition: 'transform 0.2s', boxSizing: 'border-box' },
  walletCardOrange: { flex: '1 1 250px', background: 'linear-gradient(45deg, #f093fb, #f5576c)', padding: '20px', borderRadius: '20px', textAlign: 'center', transition: 'transform 0.2s', boxSizing: 'border-box' },
  walletCardGold: { flex: '1 1 250px', background: 'linear-gradient(45deg, #fbc02d, #f57f17)', padding: '20px', borderRadius: '20px', textAlign: 'center', transition: 'transform 0.2s', boxSizing: 'border-box' },
  cardLabel: { fontSize: '0.8rem', fontWeight: 'bold' },
  cardAmount: { fontSize: '2rem', fontWeight: '900', margin: '5px 0' },
  actionBtn: { padding: '5px 15px', borderRadius: '8px', border: 'none', background: 'rgba(0,0,0,0.2)', color: 'white', cursor: 'pointer', marginTop: '10px' },
  
  promoBox: { background: 'rgba(255, 255, 255, 0.1)', padding: '20px', borderRadius: '20px', display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '30px', border: '1px dashed #ffcc33', boxSizing: 'border-box', width: '100%' },
  promoInput: { padding: '12px 20px', borderRadius: '10px', border: 'none', outline: 'none', fontSize: '1rem', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', flex: '1 1 200px', boxSizing: 'border-box', width: '100%' },
  promoBtn: { padding: '12px 25px', borderRadius: '10px', border: 'none', backgroundColor: '#00e676', color: '#000', fontWeight: '900', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 15px rgba(0, 230, 118, 0.3)', flex: '1 1 120px', boxSizing: 'border-box', width: '100%' },
  
  bottomGrid: { display: 'flex', gap: '20px', flexWrap: 'wrap', width: '100%' },
  infoBox: { flex: '1 1 250px', minWidth: '0', background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '20px', boxSizing: 'border-box', width: '100%', overflow: 'hidden' },
  winnerRow: { display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', marginBottom: '5px' },
  ticketCard: { flex: '1 1 250px', backgroundColor: '#ffcc33', padding: '25px', borderRadius: '25px', textAlign: 'center', color: '#5e3a00', boxSizing: 'border-box', width: '100%' },
  selectWrapper: { marginBottom: '15px', width: '100%' },
  walletSelect: { padding: '10px', borderRadius: '10px', width: '100%', fontSize: '1rem', boxSizing: 'border-box' },
  ticketInput: { width: '100%', padding: '15px', borderRadius: '10px', fontSize: '2.5rem', textAlign: 'center', marginBottom: '20px', fontWeight: '900', border: '2px solid #5e3a00', boxSizing: 'border-box' },
  playBtn: { width: '100%', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: '900', color: 'white', cursor: 'pointer', fontSize: '1.1rem', boxSizing: 'border-box' },
  ticketRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', marginBottom: '5px' },
  tNumber: { fontSize: '1.2rem', fontWeight: '900' },
  tryAgainBtn: { padding: '6px 12px', borderRadius: '8px', border: '1px solid #ff4b2b', backgroundColor: 'rgba(255, 75, 43, 0.1)', color: '#ffcc33', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }
};

export default Dashboard;