import React, { useState, useEffect } from 'react';
import api from '../api'; // ✅ axios ki jagah api import kiya
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const BuyTicket = () => {
  const [userData, setUserData] = useState(null);
  const [ticketNumber, setTicketNumber] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('deposit'); 
  const TICKET_PRICE = 1; 

  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    if (user && token) {
      setUserData(user);
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleBuyTicket = async (e) => {
    e.preventDefault();

    if (ticketNumber.length !== 3) {
      return toast.error("Please enter a valid 3-digit number (e.g., 000 to 999)");
    }

    if ((userData.wallets[selectedWallet] || 0) < TICKET_PRICE) {
      return toast.error(`Insufficient funds in ${selectedWallet === 'deposit' ? 'Play Balance' : 'Win Wallet'}!`);
    }

    const loading = toast.loading("Purchasing Ticket...");
    try {
      const token = localStorage.getItem('token');
      
      // ✅ Lamba link khatam
      const res = await api.post('/api/ticket/buy', 
        {
          userId: userData._id,
          ticketNumber: ticketNumber,
          walletType: selectedWallet,
          price: TICKET_PRICE
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = { ...userData };
      // Backend se fresh balance uthana hamesha behtar hai
      updatedUser.wallets[selectedWallet] = res.data.newBalance !== undefined ? res.data.newBalance : (userData.wallets[selectedWallet] - TICKET_PRICE);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUserData(updatedUser);

      toast.success(`Success! Ticket #${ticketNumber} purchased.`, { id: loading });
      setTicketNumber(''); 
      
    } catch (err) {
      console.error("Ticket Error:", err.response?.data);
      toast.error(err.response?.data?.message || "Purchase Failed!", { id: loading });
    }
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <h2 style={{color: '#ffcc33', margin: 0, fontWeight: '900'}}>🎟️ BUY TICKET</h2>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>Back to Home</button>
      </nav>

      <div style={styles.mainContent}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#00e676', fontSize: '1.8rem', margin: '0 0 10px 0' }}>Ticket Price: ${TICKET_PRICE.toFixed(2)}</h3>
            <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>Pick any 3 lucky digits and win big!</p>
          </div>

          <form onSubmit={handleBuyTicket} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Pick 3 Digits</label>
              <input 
                type="number" 
                placeholder="e.g. 777" 
                maxLength="3"
                style={styles.inputBig} 
                required
                value={ticketNumber}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.length <= 3) setTicketNumber(val);
                }}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Pay From Wallet</label>
              <select 
                style={styles.select} 
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
              >
                <option value="deposit">
                  Play Balance (${Number(userData?.wallets?.deposit || 0).toFixed(2)})
                </option>
                <option value="win">
                  Win Wallet (${Number(userData?.wallets?.win || 0).toFixed(2)})
                </option>
              </select>
            </div>

            <button type="submit" style={styles.buyBtn}>PURCHASE TICKET</button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#2e026d', minHeight: '100vh', color: 'white', fontFamily: "'Montserrat', sans-serif" },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 5%', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' },
  backBtn: { background: 'none', border: '1px solid #ffcc33', color: '#ffcc33', padding: '8px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  mainContent: { maxWidth: '400px', margin: '40px auto', padding: '0 20px' },
  card: { backgroundColor: 'rgba(255,255,255,0.08)', padding: '30px', borderRadius: '30px', backdropFilter: 'blur(15px)', boxShadow: '0 15px 35px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.9rem', fontWeight: '600', color: '#ffcc33', marginLeft: '5px' },
  inputBig: { padding: '15px', borderRadius: '15px', border: '2px solid #00baf2', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '2rem', textAlign: 'center', letterSpacing: '5px', outline: 'none', fontWeight: 'bold' },
  select: { padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '1rem', outline: 'none' },
  buyBtn: { padding: '18px', borderRadius: '15px', border: 'none', backgroundColor: '#ffcc33', color: '#000', fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer', marginTop: '15px', boxShadow: '0 5px 15px rgba(255, 204, 51, 0.3)' }
};

export default BuyTicket;