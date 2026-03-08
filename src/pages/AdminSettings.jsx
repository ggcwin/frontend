import React, { useState, useEffect } from 'react';
import api from '../api'; 
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminSettings = () => {
    const navigate = useNavigate();

    // 1. Password Reset States
    const [username, setUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // 2. All Payment & System Settings States
    const [settings, setSettings] = useState({
        usdtTRC20: '',
        usdtBEP20: '',
        usdtERC20: '',
        usdtPolygon: '',
        paytmUpi: '',
        jazzcashNumber: '',
        telegramLink: ''
    });

    // 🔄 Fetch Current Settings on Load
    useEffect(() => {
        const fetchCurrentSettings = async () => {
            try {
                const res = await api.get('/api/settings');
                if (res.data) {
                    setSettings({
                        usdtTRC20: res.data.usdtTRC20 || '',
                        usdtBEP20: res.data.usdtBEP20 || '',
                        usdtERC20: res.data.usdtERC20 || '',
                        usdtPolygon: res.data.usdtPolygon || '',
                        paytmUpi: res.data.paytmUpi || '',
                        jazzcashNumber: res.data.jazzcashNumber || '',
                        telegramLink: res.data.telegramLink || ''
                    });
                }
            } catch (err) {
                console.log("Failed to load settings. It might be empty currently.");
            }
        };
        fetchCurrentSettings();
    }, []);

    const handleReset = async (e) => {
        e.preventDefault();
        if (!username || !newPassword) return toast.error("Please fill both fields!");

        const loading = toast.loading("Updating password securely...");
        try {
            const res = await api.post('/api/admin/reset-user-password', { username, newPassword });
            toast.success(res.data.message, { id: loading });
            setUsername('');
            setNewPassword('');
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to reset password", { id: loading });
        }
    };

    // --- Payment Settings Handler ---
    const handlePaymentUpdate = async (e) => {
        e.preventDefault();
        const loading = toast.loading("Saving settings to server...");
        try {
            await api.post('/api/settings/update', settings); 
            toast.success("System Settings Updated Successfully!", { id: loading });
        } catch (err) {
            console.error("Settings Update Error:", err);
            toast.error("Update failed. Check backend route.", { id: loading });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSettings({ ...settings, [name]: value });
    };

    return (
        <div style={styles.container}>
            <nav style={styles.navbar}>
                <h1 style={styles.pageTitle}>⚙️ SYSTEM SETTINGS</h1>
                <button onClick={() => navigate('/admin/dashboard')} style={styles.backBtn}>
                    ⬅ Back to Dashboard
                </button>
            </nav>
            
            <div style={styles.contentWrapper}>
                
                {/* --- CARD 1: GLOBAL PAYMENT SETTINGS --- */}
                <div style={{...styles.card, maxWidth: '600px'}}>
                    <h2 style={{ color: '#00e676', fontSize: '1.5rem', margin: '0 0 10px 0' }}>🏦 Payment Methods</h2>
                    <p style={styles.subtitle}>
                        Update your master wallets and accounts. Players will see these details on the Deposit page.
                    </p>
                    
                    <form onSubmit={handlePaymentUpdate} style={styles.form}>
                        
                        <h4 style={styles.sectionHeader}>🟢 USDT Crypto Addresses</h4>
                        <div style={styles.grid2}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>TRC20 (Tron)</label>
                                <input type="text" name="usdtTRC20" value={settings.usdtTRC20} onChange={handleInputChange} style={styles.input} placeholder="TXYZ..." />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>BEP20 (BSC)</label>
                                <input type="text" name="usdtBEP20" value={settings.usdtBEP20} onChange={handleInputChange} style={styles.input} placeholder="0x..." />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>ERC20 (Ethereum)</label>
                                <input type="text" name="usdtERC20" value={settings.usdtERC20} onChange={handleInputChange} style={styles.input} placeholder="0x..." />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Polygon (Matic)</label>
                                <input type="text" name="usdtPolygon" value={settings.usdtPolygon} onChange={handleInputChange} style={styles.input} placeholder="0x..." />
                            </div>
                        </div>

                        <h4 style={styles.sectionHeader}>🔵 Local & Social Settings</h4>
                        <div style={styles.inputGroup}>
                            <label style={{...styles.label, color: '#00baf2'}}>Paytm / UPI (India)</label>
                            <input type="text" name="paytmUpi" value={settings.paytmUpi} onChange={handleInputChange} style={styles.input} placeholder="Phone Number or UPI ID" />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={{...styles.label, color: '#ff4b2b'}}>JazzCash (Pakistan)</label>
                            <input type="text" name="jazzcashNumber" value={settings.jazzcashNumber} onChange={handleInputChange} style={styles.input} placeholder="0300..." />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={{...styles.label, color: '#0088cc'}}>Telegram Support Link</label>
                            <input type="text" name="telegramLink" value={settings.telegramLink} onChange={handleInputChange} style={styles.input} placeholder="https://t.me/yourusername" />
                        </div>

                        <button type="submit" style={{...styles.btn, backgroundColor: '#00e676', color: '#000', boxShadow: '0 4px 0 #00b35c', marginTop: '20px'}}>
                            SAVE ALL SETTINGS
                        </button>
                    </form>
                </div>

                {/* --- CARD 2: PASSWORD RESET --- */}
                <div style={{...styles.card, maxWidth: '600px'}}>
                    <h2 style={styles.cardTitle}>🔑 Player Password Reset</h2>
                    <p style={styles.subtitle}>
                        Securely change any user's password without viewing their current one. The new password will be hashed automatically.
                    </p>
                    
                    <form onSubmit={handleReset} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Player Username</label>
                            <input 
                                type="text" placeholder="e.g., Zain_Win" 
                                style={styles.input} value={username}
                                onChange={(e) => setUsername(e.target.value.trim())} required
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>New Password</label>
                            <input 
                                type="text" placeholder="Enter new strong password" 
                                style={styles.input} value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value.trim())} required
                            />
                        </div>

                        <button type="submit" style={styles.btn}>RESET PASSWORD</button>
                    </form>
                </div>

            </div>
        </div>
    );
};

const styles = {
    container: { backgroundColor: '#121212', minHeight: '100vh', color: 'white', fontFamily: "'Montserrat', sans-serif" },
    navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 5%', backgroundColor: '#1e1e1e', borderBottom: '2px solid #333' },
    pageTitle: { color: '#ffcc33', margin: 0, fontWeight: '900', fontSize: '1.5rem' },
    backBtn: { background: 'none', border: '1px solid #ffcc33', color: '#ffcc33', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    contentWrapper: { display: 'flex', flexDirection: 'column', gap: '30px', padding: '40px 5%', alignItems: 'center' },
    card: { backgroundColor: '#1e1e1e', padding: '35px', borderRadius: '20px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid #333' },
    cardTitle: { color: '#ffcc33', fontSize: '1.5rem', margin: '0 0 10px 0' },
    subtitle: { color: '#888', fontSize: '0.9rem', marginBottom: '25px', lineHeight: '1.5' },
    sectionHeader: { margin: '20px 0 10px 0', paddingBottom: '5px', borderBottom: '1px solid #333', color: '#ccc' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { color: '#ffcc33', fontSize: '0.85rem', fontWeight: 'bold' },
    input: { padding: '12px', borderRadius: '10px', border: '1px solid #444', backgroundColor: '#2a2a2a', color: 'white', fontSize: '0.95rem', outline: 'none' },
    btn: { padding: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#ff4b2b', color: 'white', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 0 #b91d1d' }
};

const mobileStyles = `
    @media (max-width: 600px) {
        .grid2 { grid-template-columns: 1fr !important; }
    }
`;

export default function AppWrapper() {
    return (
        <>
            <style>{mobileStyles}</style>
            <AdminSettings />
        </>
    );
}