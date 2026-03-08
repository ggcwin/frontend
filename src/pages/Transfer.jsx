import React, { useState, useEffect } from 'react';
import api from '../api'; 
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Transfer = () => {
  const [senderData, setSenderData] = useState(null);
  const [formData, setFormData] = useState({
    receiverUsername: '',
    amount: '',
    fromWallet: 'deposit' 
  });

  const [fee, setFee] = useState(0);
  const [totalDeduction, setTotalDeduction] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    if (user && token) {
      setSenderData(user);
    } else {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    // ✅ FIX 1: Strictly Number conversion taake "10.03" wala issue na aaye
    const cleanAmount = Number(formData.amount) || 0;
    const calculatedFee = cleanAmount * 0.03; 
    setFee(calculatedFee);
    setTotalDeduction(cleanAmount + calculatedFee);
  }, [formData.amount]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    const cleanAmount = Number(formData.amount);
    
    if (cleanAmount < 1) return toast.error("Minimum transfer is $1.00");
    
    const finalCost = cleanAmount + (cleanAmount * 0.03);
    const currentBalance = Number(senderData.wallets[formData.fromWallet]) || 0;

    // Frontend Level Security Check
    if (currentBalance < finalCost) {
      return toast.error(`Insufficient Balance! You need $${finalCost.toFixed(2)} total (including 3% fee).`);
    }

    const loading = toast.loading("Processing secure transfer...");
    try {
      const token = localStorage.getItem('token');
      
      // ✅ FIX 2: API endpoint '/api/transfer' kar diya
      const res = await api.post('/api/transfer', 
        {
          senderId: senderData._id, 
          receiverUsername: formData.receiverUsername,
          amount: cleanAmount,
          walletType: formData.fromWallet
        },
        { 
          headers: { Authorization: `Bearer ${token}` } 
        }
      );

      // ✅ FIX 3: Backend se aane wala secure balance UI mein update kar diya
      const updatedUser = { 
          ...senderData, 
          wallets: {
              ...senderData.wallets,
              [formData.fromWallet]: res.data.newBalance
          }
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSenderData(updatedUser);

      toast.success(`Success! $${cleanAmount} sent to ${formData.receiverUsername}`, { id: loading });
      setFormData({ ...formData, receiverUsername: '', amount: '' });
      
    } catch (err) {
        console.error("Transfer Error Details:", err.response?.data);
        toast.error(err.response?.data?.message || "Transfer Failed", { id: loading });
    }
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <h2 style={{color: '#ffcc33', margin: 0, fontWeight: '900'}}>GGC TRANSFER</h2>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>Back to Home</button>
      </nav>

      <div style={styles.mainContent}>
        <div style={styles.card}>
          <div style={styles.infoBox}>
            <p style={{fontSize: '0.8rem', opacity: 0.7, marginBottom: '5px'}}>AVAILABLE BALANCE</p>
            <h3 style={{fontSize: '2rem', color: '#ffcc33'}}>
              ${Number(senderData?.wallets[formData.fromWallet] || 0).toFixed(2)}
            </h3>
          </div>

          <form onSubmit={handleTransfer} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Select Source Wallet</label>
              <select 
                style={styles.input} 
                value={formData.fromWallet}
                onChange={(e) => setFormData({...formData, fromWallet: e.target.value})}
              >
                <option value="deposit">Deposit Wallet (Play Balance)</option>
                <option value="win">Win Wallet (Withdrawable)</option>
                <option value="reward">Reward Wallet (Bonus)</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Receiver Username</label>
              <input 
                type="text" placeholder="e.g. lovely123" 
                style={styles.input} required
                value={formData.receiverUsername}
                onChange={(e) => setFormData({...formData, receiverUsername: e.target.value})}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Amount to Send ($)</label>
              <input 
                type="number" placeholder="Enter amount" 
                style={styles.input} required
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
              />
              
              {formData.amount > 0 && (
                <div style={styles.feeLedger}>
                    <div style={styles.ledgerRow}>
                        <span>Amount:</span>
                        <span>${Number(formData.amount).toFixed(2)}</span>
                    </div>
                    <div style={styles.ledgerRow}>
                        <span style={{color: '#ff4b2b'}}>Transfer Fee (3%):</span>
                        <span style={{color: '#ff4b2b'}}>- ${fee.toFixed(2)}</span>
                    </div>
                    <div style={{...styles.ledgerRow, borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '5px', paddingTop: '5px', fontWeight: 'bold'}}>
                        <span>Total Deduction:</span>
                        <span style={{color: '#ffcc33'}}>${totalDeduction.toFixed(2)}</span>
                    </div>
                </div>
              )}
            </div>

            <button type="submit" style={styles.sendBtn}>SEND SECURELY</button>
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
  mainContent: { maxWidth: '450px', margin: '40px auto', padding: '0 20px' },
  card: { backgroundColor: 'rgba(255,255,255,0.08)', padding: '30px', borderRadius: '30px', backdropFilter: 'blur(15px)', boxShadow: '0 15px 35px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' },
  infoBox: { backgroundColor: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '20px', textAlign: 'center', marginBottom: '30px', border: '1px solid rgba(255,204,51,0.3)' },
  form: { display: 'flex', flexDirection: 'column', gap: '22px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#ffcc33', marginLeft: '5px' },
  input: { padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '1rem', outline: 'none' },
  feeLedger: { marginTop: '5px', padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '12px', fontSize: '0.8rem' },
  ledgerRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '3px' },
  sendBtn: { padding: '16px', borderRadius: '15px', border: 'none', backgroundColor: '#00e676', color: '#000', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', marginTop: '10px', boxShadow: '0 5px 15px rgba(0, 230, 118, 0.3)' }
};

export default Transfer;