import React, { useState, useEffect } from 'react';
import api from '../api'; 
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const Deposit = () => {
  const [voucher, setVoucher] = useState("");
  const [userData, setUserData] = useState(null);
  const [selectedChain, setSelectedChain] = useState("TRC20");
  const [settings, setSettings] = useState({
    usdtTRC20: "Not Available", usdtBEP20: "Not Available", usdtERC20: "Not Available", usdtPolygon: "Not Available",
    paytmUpi: "Not Available", jazzcashNumber: "Not Available", telegramLink: "https://t.me/GGCWIN"
  });

  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    setUserData(savedUser);

    const fetchSettings = async () => {
      try {
        const res = await api.get('/api/settings'); 
        if (res.data) setSettings(res.data);
      } catch (err) {
        console.log("Failed to load live settings");
      }
    };
    fetchSettings();
  }, []);

  const handleVoucherRedeem = async (e) => {
    e.preventDefault();
    if (!voucher) return toast.error("Please enter a voucher code!");

    const loading = toast.loading("Verifying voucher...");
    try {
      const res = await api.post('/api/voucher/redeem', { userId: userData?._id, code: voucher }); 
      const updatedUser = { ...userData, wallets: { ...userData.wallets, deposit: res.data.newBalance } }; 
      setUserData(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success(res.data.message, { id: loading });
      setVoucher("");
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid Code!", { id: loading });
    }
  };

  const copyToClipboard = (text) => {
    if (!text || text === "Not Available") return toast.error("Address not set yet!");
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // ✅ Telegram Link open karne ka function
  const openTelegram = () => {
    if (!settings.telegramLink || settings.telegramLink === "Not Available") {
        return toast.error("Telegram support link not available right now.");
    }
    window.open(settings.telegramLink, '_blank');
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <img src={logo} alt="GGC" style={styles.logo} onClick={() => navigate('/dashboard')} />
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>← Back</button>
      </nav>

      <div style={styles.content}>
        <h1 style={styles.title}>RECHARGE WALLET</h1>
        
        {/* VOUCHER SECTION */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🎟️ Redeem Voucher</h3>
          <form onSubmit={handleVoucherRedeem} style={styles.form}>
            <input type="text" placeholder="GGC-XXXX-XXXX" value={voucher} onChange={(e) => setVoucher(e.target.value.toUpperCase())} style={styles.input} />
            <button type="submit" style={styles.goldBtn}>REDEEM NOW</button>
          </form>
        </div>

        {/* USDT PAYMENT */}
        <div style={{...styles.card, border: '2px solid #00e676'}}>
          <div style={styles.priorityBadge}>MOST POPULAR</div>
          <h3 style={{...styles.cardTitle, color: '#00e676'}}>💵 USDT Deposit</h3>
          
          <select 
            value={selectedChain} 
            onChange={(e) => setSelectedChain(e.target.value)} 
            style={styles.userChainSelect}
          >
            <option value="TRC20">TRC20 (Tron)</option>
            <option value="BEP20">BEP20 (Binance Smart Chain)</option>
            <option value="ERC20">ERC20 (Ethereum)</option>
            <option value="Polygon">Polygon (Matic)</option>
          </select>

          <p style={styles.cardSubtitle}><span style={{ color: '#ff4b2b', fontWeight: 'bold' }}>*Transfer fee must be paid by the sender.</span></p>
          
          <div style={styles.addressBox} onClick={() => copyToClipboard(settings[`usdt${selectedChain}`])}>
            <span style={styles.addressText}>{settings[`usdt${selectedChain}`] || "Not Available"}</span>
            <span style={{fontSize: '0.8rem', color: '#00e676'}}>Click to Copy</span>
          </div>
        </div>

        {/* PAYTM SECTION */}
        <div style={styles.card}>
          <h3 style={{...styles.cardTitle, color: '#00baf2'}}>🇮🇳 Paytm / UPI (India)</h3>
          <div style={styles.methodBox} onClick={() => copyToClipboard(settings.paytmUpi)}>
            <p style={{...styles.phone, color: '#00baf2'}}>{settings.paytmUpi}</p>
          </div>
        </div>

        {/* JAZZCASH SECTION */}
        <div style={styles.card}>
          <h3 style={{...styles.cardTitle, color: '#ff4b2b'}}>🇵🇰 JazzCash (Pakistan)</h3>
          <div style={styles.methodBox} onClick={() => copyToClipboard(settings.jazzcashNumber)}>
            <p style={{...styles.phone, color: '#ff4b2b'}}>{settings.jazzcashNumber}</p>
          </div>
        </div>

        {/* ✅ NAYA: TELEGRAM SUPPORT SECTION */}
        <div 
          onClick={openTelegram}
          style={{
              ...styles.card, 
              border: '2px dashed #0088cc', 
              cursor: 'pointer', 
              background: 'linear-gradient(135deg, rgba(0, 136, 204, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%)',
              marginTop: '30px',
              transition: 'transform 0.2s'
          }}
        >
          <h3 style={{...styles.cardTitle, color: '#00baf2', marginBottom: '8px', fontSize: '1.5rem'}}>💬 Send Proof on Telegram</h3>
          <p style={{fontSize: '0.95rem', color: '#fff', opacity: 0.9, margin: 0, fontWeight: 'bold'}}>
            Click here to send payment screenshot to Admin
          </p>
        </div>

      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#2e026d', backgroundImage: 'linear-gradient(135deg, #2e026d 0%, #51127c 100%)', color: 'white', minHeight: '100vh', padding: '0 20px 50px', fontFamily: "'Montserrat', sans-serif" },
  navbar: { display: 'flex', justifyContent: 'space-between', padding: '20px 0', maxWidth: '1100px', margin: '0 auto' },
  logo: { height: '45px', cursor: 'pointer' },
  backBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' },
  content: { maxWidth: '500px', margin: '30px auto', textAlign: 'center' },
  title: { fontSize: '2.5rem', fontWeight: '900', marginBottom: '30px' },
  card: { backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(15px)', padding: '25px', borderRadius: '24px', marginBottom: '20px', position: 'relative' },
  priorityBadge: { position: 'absolute', top: '-12px', right: '20px', backgroundColor: '#00e676', color: '#000', fontSize: '0.7rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '50px' },
  cardTitle: { marginBottom: '10px', fontSize: '1.4rem', fontWeight: 'bold' },
  cardSubtitle: { fontSize: '0.85rem', opacity: 0.8, marginBottom: '15px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '1.1rem', textAlign: 'center' },
  goldBtn: { padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(45deg, #ffcc33, #ffb347)', color: '#5e3a00', fontWeight: 'bold', cursor: 'pointer' },
  userChainSelect: { width: '100%', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #00e676', outline: 'none', fontSize: '1rem', fontWeight: 'bold', marginBottom: '15px', textAlign: 'center' },
  addressBox: { backgroundColor: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '12px', cursor: 'pointer', border: '1px dashed #00e676', display: 'flex', flexDirection: 'column', gap: '5px' },
  addressText: { fontSize: '0.9rem', wordBreak: 'break-all', fontFamily: 'monospace' },
  methodBox: { backgroundColor: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', cursor: 'pointer' },
  phone: { fontSize: '1.2rem', fontWeight: 'bold' }
};

export default Deposit;