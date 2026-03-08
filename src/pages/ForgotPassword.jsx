import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // Step 1: Email, Step 2: OTP & New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Step 1: Send OTP to Email
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email) return toast.error("Please enter your email");
        
        setLoading(true);
        const loadingToast = toast.loading("Sending OTP to your email...");
        try {
            const res = await api.post('/api/auth/forgot-password', { email });
            toast.success(res.data.message, { id: loadingToast });
            setStep(2); // Move to OTP screen
        } catch (err) {
            toast.error(err.response?.data?.message || "Error sending email", { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP and Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!otp || !newPassword) return toast.error("Please fill all fields");
        if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");

        setLoading(true);
        const loadingToast = toast.loading("Resetting password...");
        try {
            const res = await api.post('/api/auth/reset-password', { email, otp, newPassword });
            toast.success(res.data.message, { id: loadingToast });
            navigate('/login'); // Password theek hone ke baad login par bhej dein
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid or Expired OTP", { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>GGC WIN</h1>
                <h2 style={styles.subtitle}>{step === 1 ? 'Reset Password' : 'Enter OTP'}</h2>
                
                {step === 1 ? (
                    <form onSubmit={handleSendOtp} style={styles.form}>
                        <p style={styles.text}>Enter your registered email address to receive a 6-digit OTP code.</p>
                        <input 
                            type="email" 
                            placeholder="Email Address" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            style={styles.input} 
                            required 
                        />
                        <button type="submit" disabled={loading} style={styles.btn}>
                            {loading ? 'SENDING...' : 'SEND OTP'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} style={styles.form}>
                        <p style={styles.text}>An OTP has been sent to <b>{email}</b></p>
                        <input 
                            type="text" 
                            placeholder="Enter 6-digit OTP" 
                            value={otp} 
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                            style={styles.input} 
                            required 
                        />
                        <input 
                            type="password" 
                            placeholder="Enter New Password" 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)} 
                            style={styles.input} 
                            required 
                        />
                        <button type="submit" disabled={loading} style={styles.btn}>
                            {loading ? 'RESETTING...' : 'RESET PASSWORD'}
                        </button>
                    </form>
                )}
                
                <button onClick={() => navigate('/login')} style={styles.backBtn}>
                    Back to Login
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: { backgroundColor: '#2e026d', backgroundImage: 'linear-gradient(135deg, #2e026d 0%, #51127c 100%)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: "'Montserrat', sans-serif", padding: '20px' },
    card: { backgroundColor: 'rgba(0,0,0,0.4)', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '400px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
    title: { color: '#ffcc33', fontSize: '2.5rem', fontWeight: '900', margin: '0 0 10px 0' },
    subtitle: { color: 'white', fontSize: '1.2rem', margin: '0 0 20px 0' },
    text: { color: '#ccc', fontSize: '0.9rem', marginBottom: '20px' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    input: { padding: '15px', borderRadius: '10px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '1rem', outline: 'none' },
    btn: { padding: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#ff4b2b', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
    backBtn: { background: 'none', border: 'none', color: '#ffcc33', marginTop: '20px', cursor: 'pointer', textDecoration: 'underline' }
};

export default ForgotPassword;