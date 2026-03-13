import React, { useState, useEffect } from 'react';
import api from '../api'; 
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem('user');
    
    // Agar data bilkul nahi hai ya "undefined" string hai, tabhi login par bhejen
    if (!data || data === "undefined") {
      navigate('/');
      return;
    }

    try {
      const savedUser = JSON.parse(data);
      setUser(savedUser);
      
      // Pehle check karo ke ID hai ya nahi, phir fetch karo
      if (savedUser && savedUser._id) {
        fetchProfile(savedUser._id);
      }
    } catch (err) {
      console.log("Local data issue, staying on page");
    }
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const res = await api.get(`/api/auth/profile/${userId}`);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) {
      console.log("Using cached data because server is busy");
    }
  };

  // ✨ THE NUCLEAR FIX: HARD LOGOUT
  const handleLogout = (e) => {
    if (e) e.preventDefault();
    
    // 1. Sab kuch delete karo (Token, User, har cheez)
    localStorage.clear();
    sessionStorage.clear();
    
    // 2. React Router ki history ko bypass kar ke zero state par wapas phenko
    window.location.href = '/';
  };

  const referralLink = `${window.location.origin}/register?ref=${user?.username}`;

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return toast.error("Passwords do not match!");
    const loading = toast.loading("Updating...");
    try {
      await api.post('/api/auth/update-password', {
        userId: user._id,
        oldPassword: passwords.old,
        newPassword: passwords.new
      });
      toast.success("Updated!", { id: loading });
      setPasswords({ old: '', new: '', confirm: '' });
    } catch (err) {
      toast.error("Update failed", { id: loading });
    }
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <h2 style={{color: '#ffcc33', margin: 0}}>MY PROFILE</h2>
        <div style={{display: 'flex', gap: '10px'}}>
            <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>Dashboard</button>
            <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </nav>

      <div style={styles.content}>
        
        {/* Profile Card with Earnings */}
        <div style={styles.card}>
          <div style={styles.avatar}>{user?.username?.charAt(0).toUpperCase()}</div>
          <h2 style={{marginTop: '15px'}}>{user?.fullName || user?.username}</h2>
          <p style={{opacity: 0.7}}>{user?.email}</p>
          
          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <small>Total Earned</small>
              <p style={{color: '#ffcc33', fontWeight: 'bold'}}>${Number(user?.totalEarning || 0).toFixed(2)}</p>
            </div>
            <div style={styles.statBox}>
              <small>Win Wallet</small>
              <p style={{color: '#00e676', fontWeight: 'bold'}}>${Number(user?.wallets?.win || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Affiliate Program */}
        <div style={styles.card}>
          <h3 style={{color: '#ffcc33', marginBottom: '10px'}}>🔗 Affiliate Program</h3>
          <p style={{fontSize: '0.85rem', opacity: 0.8, marginBottom: '15px'}}>
            Share your link and get **5% commission** on every win of your referrals!
          </p>
          <div style={styles.referralStatsGrid}>
            <div style={styles.miniStat}>
              <small>Total Referrals</small>
              <p style={{fontSize: '1.2rem', fontWeight: 'bold'}}>{user?.referralCount || 0}</p>
            </div>
            <div style={styles.miniStat}>
              <small>Referral Earn</small>
              <p style={{fontSize: '1.2rem', fontWeight: 'bold', color: '#ffcc33'}}>${Number(user?.referralEarnings || 0).toFixed(2)}</p>
            </div>
          </div>
          <div style={styles.copyBox} onClick={() => {
              navigator.clipboard.writeText(referralLink);
              toast.success("Copied!");
          }}>
            <span style={styles.linkText}>{referralLink}</span>
            <span style={{color: '#ffcc33', fontWeight: 'bold'}}>COPY</span>
          </div>
        </div>

        {/* Security Settings */}
        <div style={styles.card}>
          <h3 style={{marginBottom: '20px'}}>🔐 Security Settings</h3>
          <form onSubmit={handlePasswordChange} style={styles.form}>
            <input type="password" placeholder="Current Password" style={styles.input} required value={passwords.old} onChange={(e) => setPasswords({...passwords, old: e.target.value})} />
            <input type="password" placeholder="New Password" style={styles.input} required value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} />
            <input type="password" placeholder="Confirm Password" style={styles.input} required value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} />
            <button type="submit" style={styles.updateBtn}>Update Password</button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#2e026d', backgroundImage: 'linear-gradient(135deg, #2e026d 0%, #51127c 100%)', color: 'white', minHeight: '100vh', paddingBottom: '50px', fontFamily: "'Montserrat', sans-serif" },
  navbar: { display: 'flex', justifyContent: 'space-between', padding: '20px 5%', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' },
  backBtn: { background: 'none', border: '1px solid #ffcc33', color: '#ffcc33', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' },
  logoutBtn: { backgroundColor: '#ff4b2b', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  content: { maxWidth: '500px', margin: '30px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { backgroundColor: 'rgba(255,255,255,0.1)', padding: '25px', borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' },
  avatar: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#ffcc33', color: '#5e3a00', fontSize: '2.5rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' },
  statsRow: { display: 'flex', gap: '10px', marginTop: '20px' },
  statBox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '12px' },
  referralStatsGrid: { display: 'flex', gap: '10px', marginBottom: '15px' },
  miniStat: { flex: 1, padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '15px' },
  copyBox: { display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', cursor: 'pointer', border: '1px dashed #ffcc33' },
  linkText: { fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: 'white', color: '#333' },
  updateBtn: { padding: '12px', borderRadius: '10px', backgroundColor: '#ff4b2b', color: 'white', border: 'none', fontWeight: 'bold' }
};

export default Profile;