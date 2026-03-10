import Navbar from '../components/Navbar';
import React, { useEffect, useState } from 'react';
import api from '../api'; 
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
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
  
  // ✨ DRAW HISTORY STATES
  const [historyDate, setHistoryDate] = useState(''); 
  const [pastResult, setPastResult] = useState(null);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

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
      const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Karachi',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hourCycle: 'h23'
      });

      const parts = formatter.formatToParts(now);
      const getPart = (type) => parts.find(p => p.type === type).value;

      const hour = parseInt(getPart('hour'));
      const minute = parseInt(getPart('minute'));
      const second = parseInt(getPart('second'));

      let targetUTC = new Date(Date.UTC(parseInt(getPart('year')), parseInt(getPart('month')) - 1, parseInt(getPart('day')), 18, 0, 0));

      if (hour >= 23) {
          targetUTC.setUTCDate(targetUTC.getUTCDate() + 1);
      }

      const diff = targetUTC.getTime() - now.getTime();

      if (diff <= 180000 && diff > 0) {
          setIsButtonDisabled(true);
      } else {
          setIsButtonDisabled(false);
      }

      if (hour === 23 && minute === 0 && second === 0) {
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
      } catch (err) { console.error("Winners Fetch Error:", err); }
  };

  // 🚀 MOBILE CACHE FIX
  const fetchMyTickets = async (userId) => {
      try {
          const res = await api.get(`/api/ticket/my-tickets/${userId}?t=${new Date().getTime()}`);
          setMyTickets(res.data);
      } catch (err) { console.error("Ticket Fetch Error:", err); }
  };

  // ✨ DRAW HISTORY FETCH FUNCTION
  const fetchPastResult = async (date) => {
    if (!date) return;
    setIsFetchingHistory(true);
    try {
        const res = await api.get(`/api/draw/result-by-date?date=${date}`);
        setPastResult(res.data);
    } catch (err) {
        toast.error("Result not found for this date.");
        setPastResult(null);
    } finally {
        setIsFetchingHistory(false);
    }
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
          generatedWinners = (res.data && res.data.isRigged) ? res.data.nextWinners : [
              Math.floor(Math.random() * 1000).toString().padStart(3, '0'), 
              Math.floor(Math.random() * 1000).toString().padStart(3, '0'), 
              Math.floor(Math.random() * 1000).toString().padStart(3, '0')  
          ];
      } catch (err) {
          generatedWinners = Array(3).fill(0).map(() => Math.floor(Math.random() * 1000).toString().padStart(3, '0'));
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
          }, 8000); 
      });
  };

  const handleRedeemVoucher = async () => {
    if (!voucherCode.trim()) return toast.error("Please enter a voucher code!");
    const loadingToast = toast.loading("Verifying Voucher...");
    try {
        const res = await api.post('/api/voucher/redeem', { userId: userData._id, code: voucherCode.trim() });
        const updatedUser = { ...userData, wallets: { ...userData.wallets, [res.data.walletType || 'reward']: res.data.newBalance } };
        setUserData(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success(`🎉 Voucher Redeemed! $${res.data.amount} added!`, { id: loadingToast });
        setVoucherCode(""); 
    } catch (err) { toast.error(err.response?.data?.message || "Invalid Voucher!", { id: loadingToast }); }
  };

  const submitEntry = async () => {
    if (isButtonDisabled) return toast.error("⏳ Draw in progress!");
    const fee = 0.5; 
    if (!userData?.wallets) return toast.error("Session expired!");
    if ((userData.wallets[selectedWallet] || 0) < fee) return toast.error("Low Balance!");
    if (luckyNumber.length !== 3) return toast.error("Enter 3 lucky digits!");

    const loadingToast = toast.loading("Buying Ticket...");
    try {
      const res = await api.post('/api/ticket/buy', { userId: userData._id, ticketNumber: luckyNumber, walletType: selectedWallet, price: fee });
      const updatedUser = { ...userData, wallets: { ...userData.wallets, [selectedWallet]: res.data.newBalance } };
      setUserData(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success(`Confirmed #${luckyNumber}`, { id: loadingToast });
      setLuckyNumber(""); 
      fetchMyTickets(userData._id);
    } catch (err) { toast.error("Error occurred!", { id: loadingToast }); }
  };

  const handleTryAgain = async (ticketNumber) => {
      if (isButtonDisabled) return toast.error("⏳ Draw in progress!");
      const fee = 0.5;
      let walletToUse = userData.wallets.deposit >= fee ? 'deposit' : userData.wallets.win >= fee ? 'win' : userData.wallets.reward >= fee ? 'reward' : null;
      if (!walletToUse) return toast.error("Insufficient Balance!");

      const loadingToast = toast.loading(`Buying #${ticketNumber}...`);
      try {
          const res = await api.post('/api/ticket/buy', { userId: userData._id, ticketNumber: ticketNumber, walletType: walletToUse, price: fee });
          const updatedUser = { ...userData, wallets: { ...userData.wallets, [walletToUse]: res.data.newBalance } };
          setUserData(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          toast.success(`Bought #${ticketNumber}!`, { id: loadingToast });
          fetchMyTickets(userData._id); 
      } catch (err) { toast.error("Error buying ticket!", { id: loadingToast }); }
  };

  return (
    <div style={styles.container}>
      
      {/* 🎨 CSS INJECTION FOR MONEY ANIMATION */}
      <style>{`
        .money-rain-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .money-drop {
          position: absolute;
          top: -10%;
          font-size: 2rem;
          opacity: 0.5;
          animation: fallDown linear infinite;
        }
        @keyframes fallDown {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>

      {/* 💸 FALLING MONEY HTML 💸 */}
      <div className="money-rain-container">
          {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className="money-drop" style={{ left: `${Math.random() * 100}%`, animationDuration: `${Math.random() * 4 + 3}s`, animationDelay: `${Math.random() * 2}s` }}>💸</div>
          ))}
      </div>

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

      {/* Main Content Area (Z-Index fix for clicking) */}
      <div style={{ filter: showSlotMachine ? 'blur(10px) grayscale(80%)' : 'none', transition: '1s', width: '100%', position: 'relative', zIndex: 1 }}>
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
              <div onClick={() => navigate('/history', { state: { filterWallet: 'deposit' } })} style={styles.walletCardPurple}>
                <p style={styles.cardLabel}>PLAY BALANCE</p>
                <p style={styles.cardAmount}>${Number(userData?.wallets?.deposit || 0).toFixed(2)}</p>
                <button onClick={(e) => { e.stopPropagation(); navigate('/deposit'); }} style={styles.actionBtn}>➕ DEPOSIT</button>
              </div>

              <div onClick={() => navigate('/history', { state: { filterWallet: 'win' } })} style={styles.walletCardOrange}>
                <p style={styles.cardLabel}>WIN WALLET</p>
                <p style={styles.cardAmount}>${Number(userData?.wallets?.win || 0).toFixed(2)}</p>
                <button onClick={(e) => { e.stopPropagation(); navigate('/withdraw'); }} style={styles.actionBtn}>💸 WITHDRAW</button>
              </div>
              
              <div onClick={() => navigate('/history', { state: { filterWallet: 'reward' } })} style={styles.walletCardGold}>
                <p style={styles.cardLabel}>REWARD / BONUS</p>
                <p style={styles.cardAmount}>${Number(userData?.wallets?.reward || 0).toFixed(2)}</p>
                <span style={{fontSize: '0.7rem', opacity: 0.8}}>CLICK TO VIEW HISTORY</span>
              </div>
            </div>

            <div style={styles.promoBox}>
                <h3 style={{ color: '#ffcc33', margin: 0 }}>Got a Promo Code?</h3>
                <input type="text" placeholder="ENTER VOUCHER" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} style={styles.promoInput} />
                <button onClick={handleRedeemVoucher} style={styles.promoBtn}>REDEEM</button>
            </div>

            <div style={styles.bottomGrid}>
              {/* --- TICKET PURCHASE BOX --- */}
              <div style={styles.ticketCard}>
                <h2>Pick 3 Digits</h2>
                <div style={styles.selectWrapper}>
                    <select value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)} style={styles.walletSelect} disabled={isButtonDisabled}>
                        <option value="deposit">Play Balance (${Number(userData?.wallets?.deposit || 0).toFixed(2)})</option>
                        <option value="win">Win Wallet (${Number(userData?.wallets?.win || 0).toFixed(2)})</option>
                        <option value="reward">Reward (${Number(userData?.wallets?.reward || 0).toFixed(2)})</option>
                    </select>
                </div>
                <input type="text" placeholder="000" value={luckyNumber} onChange={(e) => setLuckyNumber(e.target.value.replace(/\D/g, "").slice(0,3))} style={styles.ticketInput} disabled={isButtonDisabled}/>
                <button onClick={submitEntry} disabled={isButtonDisabled} style={{...styles.playBtn, backgroundColor: isButtonDisabled ? '#555' : '#ff4b2b'}}>{isButtonDisabled ? "⏳ PAUSED" : "BUY TICKET ($0.50)"}</button>
              </div>
              
              {/* --- MY TICKETS BOX --- */}
              <div style={styles.infoBox}>
                <h3>My Tickets</h3>
                <div style={{maxHeight: '300px', overflowY: 'auto', paddingBottom: '10px'}}>
                    {myTickets.length > 0 ? myTickets.map((t, i) => {
                        let numC = t.status === 'won' ? '#00e676' : t.status === 'lost' || t.status === 'expired' ? '#ff4b2b' : '#ffcc33';
                        return (
                        <div key={i} style={styles.ticketRow}>
                            <div>
                                <span style={{...styles.tNumber, color: numC}}>#{t.chosenNumbers[0]}</span>
                                <div style={{fontSize: '0.7rem', opacity: 0.7}}>{new Date(t.createdAt).toLocaleDateString()}</div>
                            </div>
                            {t.status === 'lost' || t.status === 'expired' ? (
                                <button onClick={() => handleTryAgain(t.chosenNumbers[0])} disabled={isButtonDisabled} style={styles.tryAgainBtn}>↻ Try Again</button>
                            ) : <span style={{ fontWeight: 'bold', color: numC }}>{t.status.toUpperCase()}</span>}
                        </div>
                        );
                    }) : <p style={{opacity: 0.7, textAlign: 'center', marginTop: '20px'}}>No tickets bought.</p>}
                </div>
              </div>
              
              {/* --- ✨ DRAW HISTORY BOX --- */}
              <div style={styles.infoBox}>
                  <h3>📅 Past Draw Result</h3>
                  <div style={{marginBottom: '10px'}}>
                      <input 
                        type="date" 
                        value={historyDate} 
                        onChange={(e) => { setHistoryDate(e.target.value); fetchPastResult(e.target.value); }} 
                        style={styles.dateInput} 
                      />
                  </div>
                  <div style={styles.historyResult}>
                      {isFetchingHistory ? <p>Loading...</p> : 
                        pastResult?.winningNumber ? (
                          <div style={{textAlign: 'center'}}>
                              <p style={{fontSize: '0.8rem', opacity: 0.7, margin: 0}}>Winning Number:</p>
                              <h1 style={{color: '#00e676', fontSize: '2.2rem', margin: 0}}>#{pastResult.winningNumber}</h1>
                          </div>
                        ) : <p style={{opacity: 0.5, textAlign: 'center'}}>Pick a date to check result.</p>
                      }
                  </div>
                  <hr style={{opacity: 0.1, margin: '15px 0'}} />
                  <h4 style={{marginBottom: '10px', fontSize: '0.9rem'}}>Recent Winners</h4>
                  {realWinners.slice(0, 3).map((w, i) => (
                      <div key={i} style={styles.winnerRow}><span>{w.username}</span><b style={{color: '#00e676'}}>${w.prize}</b></div>
                  ))}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#2e026d', backgroundImage: 'linear-gradient(135deg, #2e026d 0%, #51127c 100%)', color: 'white', minHeight: '100vh', padding: '0 0 50px 0', fontFamily: "'Montserrat', sans-serif" },
  slotOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' },
  slotMachineBox: { backgroundColor: '#1a0033', border: '5px solid #ffcc33', borderRadius: '30px', padding: '30px', textAlign: 'center', width: '90%', maxWidth: '350px' },
  slotTitle: { color: '#ffcc33', fontSize: '1.8rem', marginBottom: '20px' },
  slotWindow: { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px' },
  slotReel: { width: '60px', height: '80px', backgroundColor: 'white', color: '#000', fontSize: '3rem', fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '10px' },
  slotSubtitle: { color: '#00e676', fontSize: '1rem', marginBottom: '20px' },
  resultsBoard: { display: 'flex', flexDirection: 'column', gap: '8px' },
  resultItem: { display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' },
  timerChip: { backgroundColor: '#ff4b2b', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold' },
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
  walletCardPurple: { flex: '1 1 250px', background: 'linear-gradient(45deg, #11998e, #38ef7d)', padding: '20px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer' },
  walletCardOrange: { flex: '1 1 250px', background: 'linear-gradient(45deg, #f093fb, #f5576c)', padding: '20px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer' },
  walletCardGold: { flex: '1 1 250px', background: 'linear-gradient(45deg, #fbc02d, #f57f17)', padding: '20px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer' },
  cardLabel: { fontSize: '0.8rem', fontWeight: 'bold' },
  cardAmount: { fontSize: '1.8rem', fontWeight: '900', margin: '5px 0' },
  actionBtn: { padding: '5px 15px', borderRadius: '8px', border: 'none', background: 'rgba(0,0,0,0.2)', color: 'white', cursor: 'pointer', marginTop: '5px' },
  promoBox: { background: 'rgba(255, 255, 255, 0.1)', padding: '20px', borderRadius: '20px', display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '30px', border: '1px dashed #ffcc33' },
  promoInput: { padding: '12px', borderRadius: '10px', border: 'none', fontSize: '1rem', fontWeight: 'bold', textAlign: 'center', flex: '1 1 200px' },
  promoBtn: { padding: '12px 25px', borderRadius: '10px', border: 'none', backgroundColor: '#00e676', color: '#000', fontWeight: '900', cursor: 'pointer' },
  bottomGrid: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  infoBox: { flex: '1 1 280px', background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '20px', boxSizing: 'border-box', width: '100%', overflow: 'hidden' },
  ticketCard: { flex: '1 1 280px', backgroundColor: '#ffcc33', padding: '25px', borderRadius: '25px', textAlign: 'center', color: '#5e3a00', boxSizing: 'border-box', width: '100%' },
  walletSelect: { padding: '10px', borderRadius: '10px', width: '100%', marginBottom: '10px', fontSize: '1rem', boxSizing: 'border-box' },
  ticketInput: { width: '100%', padding: '12px', borderRadius: '10px', fontSize: '2.5rem', textAlign: 'center', marginBottom: '15px', fontWeight: '900', border: '2px solid #5e3a00', boxSizing: 'border-box' },
  playBtn: { width: '100%', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: '900', color: 'white', cursor: 'pointer', fontSize: '1.1rem', boxSizing: 'border-box' },
  ticketRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', marginBottom: '5px' },
  tNumber: { fontSize: '1.2rem', fontWeight: '900' },
  tryAgainBtn: { padding: '5px 10px', borderRadius: '8px', border: '1px solid #ff4b2b', color: '#ffcc33', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' },
  dateInput: { width: '100%', padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', outline: 'none' },
  historyResult: { padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '15px', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  winnerRow: { display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', marginBottom: '5px', fontSize: '0.85rem' }
};

export default Dashboard;