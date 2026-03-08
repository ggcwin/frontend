import React, { useState } from 'react';
import api from '../api'; // Hamara custom axios instance
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminSettings = () => {
    const navigate = useNavigate();

    // 1. Password Reset States
    const [username, setUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // 2. Payment Settings State
    const [usdtAddress, setUsdtAddress] = useState('TXYZ... (Your TRC20 Address)');

    // --- Password Reset Handler ---
    const handleReset = async (e) => {
        e.preventDefault();
        
        if (!username || !newPassword) {
            return toast.error("Please fill both fields!");
        }

        const loading = toast.loading("Updating password securely...");
        try {
            const res = await api.post('/api/admin/reset-user-password', { 
                username, 
                newPassword 
            });
            
            toast.success(res.data.message, { id: loading });
            
            // Fields ko wapas khali karna
            setUsername('');
            setNewPassword('');
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to reset password", { id: loading });
        }
    };

    // --- Payment Settings Handler ---
    const handlePaymentUpdate = (e) => {
        e.preventDefault();
        if(!usdtAddress) return toast.error("Please enter an address");
        // Filhal UI mein update hoga, iska backend link hum aagay ja kar laga lenge
        toast.success("Admin USDT Address Updated Successfully!");
    };

    return (
        <div style={styles.container}>
            {/* Top Navbar */}
            <nav style={styles.navbar}>
                <h1 style={styles.pageTitle}>⚙️ SYSTEM SETTINGS</h1>
                <button onClick={() => navigate('/admin/dashboard')} style={styles.backBtn}>
                    ⬅ Back to Dashboard
                </button>
            </nav>
            
            <div style={styles.contentWrapper}>
                
                {/* --- CARD 1: PAYMENT SETTINGS --- */}
                <div style={styles.card}>
                    <h2 style={{ color: '#00e676', fontSize: '1.5rem', margin: '0 0 10px 0' }}>🏦 Payment Settings</h2>
                    <p style={styles.subtitle}>
                        Set your master TRC20 wallet address. Players will see this address when they want to deposit funds.
                    </p>
                    
                    <form onSubmit={handlePaymentUpdate} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Admin USDT (TRC20) Address</label>
                            <input 
                                type="text" 
                                placeholder="Enter your wallet address" 
                                style={styles.input}
                                value={usdtAddress}
                                onChange={(e) => setUsdtAddress(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" style={{...styles.btn, backgroundColor: '#00e676', color: '#000', boxShadow: '0 4px 0 #00b35c'}}>
                            UPDATE ADDRESS
                        </button>
                    </form>
                </div>

                {/* --- CARD 2: PASSWORD RESET --- */}
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>🔑 Player Password Reset</h2>
                    <p style={styles.subtitle}>
                        Securely change any user's password without viewing their current one. The new password will be hashed automatically.
                    </p>
                    
                    <form onSubmit={handleReset} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Player Username</label>
                            <input 
                                type="text" 
                                placeholder="e.g., Zain_Win" 
                                style={styles.input}
                                value={username}
                                onChange={(e) => setUsername(e.target.value.trim())}
                                required
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>New Password</label>
                            <input 
                                type="text" 
                                placeholder="Enter new strong password" 
                                style={styles.input}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value.trim())}
                                required
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
    container: { 
        backgroundColor: '#121212', 
        minHeight: '100vh', 
        color: 'white', 
        fontFamily: "'Montserrat', sans-serif" 
    },
    navbar: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '20px 5%', 
        backgroundColor: '#1e1e1e', 
        borderBottom: '2px solid #333' 
    },
    pageTitle: { color: '#ffcc33', margin: 0, fontWeight: '900', fontSize: '1.5rem' },
    backBtn: { background: 'none', border: '1px solid #ffcc33', color: '#ffcc33', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    contentWrapper: { display: 'flex', flexDirection: 'column', gap: '30px', padding: '40px 5%', alignItems: 'center' },
    card: { 
        backgroundColor: '#1e1e1e', 
        padding: '35px', 
        borderRadius: '20px', 
        width: '100%',
        maxWidth: '500px', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)', 
        border: '1px solid #333' 
    },
    cardTitle: { color: '#ffcc33', fontSize: '1.5rem', margin: '0 0 10px 0' },
    subtitle: { color: '#888', fontSize: '0.9rem', marginBottom: '25px', lineHeight: '1.5' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { color: '#ffcc33', fontSize: '0.9rem', fontWeight: 'bold' },
    input: { 
        padding: '15px', 
        borderRadius: '10px', 
        border: '1px solid #444', 
        backgroundColor: '#2a2a2a', 
        color: 'white', 
        fontSize: '1rem', 
        outline: 'none' 
    },
    btn: { 
        padding: '15px', 
        borderRadius: '10px', 
        border: 'none', 
        backgroundColor: '#ff4b2b', 
        color: 'white', 
        fontWeight: '900', 
        fontSize: '1.1rem', 
        cursor: 'pointer', 
        marginTop: '10px',
        boxShadow: '0 4px 0 #b91d1d'
    }
};

export default AdminSettings;