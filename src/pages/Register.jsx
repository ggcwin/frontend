import React, { useState, useEffect } from 'react';
import api from '../api'; 
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const Register = () => {
    const [searchParams] = useSearchParams();
    const refFromUrl = searchParams.get('ref');

    const [formData, setFormData] = useState({ 
        username: '', 
        fullName: '', 
        email: '', 
        password: '', 
        referralCode: refFromUrl || '' 
    });
    
    const navigate = useNavigate();

    useEffect(() => {
        if (refFromUrl) {
            setFormData(prev => ({ ...prev, referralCode: refFromUrl }));
        }
    }, [refFromUrl]);

    const handleRegister = async (e) => {
        e.preventDefault();
        const loading = toast.loading("Creating Account...");
        
        console.log("Sending Data to Backend:", formData); // ✅ Testing ke liye console check karein

        try {
            await api.post('/api/auth/register', formData);
            toast.success("Registration Successful!", { id: loading });
            navigate('/'); 
        } catch (err) {
            toast.error(err.response?.data?.message || "Registration Failed", { id: loading });
        }
    };

    return (
        <div style={styles.container}>
            <div className="slot-rain">
                {[...Array(25)].map((_, i) => (
                    <div key={i} className="slot-reel" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s` }}>
                        <div className="number-stepper">
                            {[7, 2, 9, 0, 5, 3, 8, 1, 4, 6, 7].map((n, idx) => <div key={idx}>{n}</div>)}
                        </div>
                    </div>
                ))}
            </div>

            <nav style={styles.navbar}><h2 style={{ color: '#ffcc33', margin: 0 }}>GGC WIN</h2></nav>

            <div style={styles.mainContent}>
                <div style={styles.glassPanel}>
                    <h1 style={{ color: '#ffcc33', marginBottom: '10px' }}>CREATE ACCOUNT</h1>
                    
                    <form onSubmit={handleRegister} style={styles.form}>
                        <input type="text" placeholder="FULL NAME" style={styles.input} onChange={(e) => setFormData({...formData, fullName: e.target.value})} required />
                        <input type="text" placeholder="USERNAME" style={styles.input} onChange={(e) => setFormData({...formData, username: e.target.value})} required />
                        <input type="email" placeholder="EMAIL ADDRESS" style={styles.input} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                        <input type="password" placeholder="PASSWORD" style={styles.input} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                        
                        <div style={{position: 'relative'}}>
                            <input 
                                type="text" 
                                placeholder="REFERRAL CODE (OPTIONAL)" 
                                style={{...styles.input, borderColor: formData.referralCode ? '#00e676' : 'rgba(255,255,255,0.2)', width: '100%'}} 
                                value={formData.referralCode}
                                onChange={(e) => setFormData({...formData, referralCode: e.target.value})} 
                            />
                            {formData.referralCode && <span style={{position: 'absolute', right: '10px', top: '12px'}}>🎁</span>}
                        </div>

                        <button type="submit" style={styles.spinBtn}>SPIN TO JOIN</button>
                    </form>
                    <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>Already a player? <span onClick={() => navigate('/')} style={{ color: '#ffcc33', cursor: 'pointer', fontWeight: 'bold' }}>LOGIN</span></p>
                </div>
            </div>

            <style>{`
                @keyframes spin { 0% { transform: translateY(0); } 100% { transform: translateY(-90.9%); } }
                .slot-rain { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
                .slot-reel { position: absolute; color: white; animation: fall 10s linear infinite; height: 1.2em; overflow: hidden; font-weight: 900; }
                @keyframes fall { 0% { transform: translateY(-10vh); opacity: 0; } 10% { opacity: 0.15; } 100% { transform: translateY(110vh); opacity: 0; } }
                .number-stepper { animation: spin 3s linear infinite; }
                .number-stepper div { height: 1.2em; text-align: center; }
            `}</style>
        </div>
    );
};

const styles = {
    container: { backgroundColor: '#2e026d', backgroundImage: 'linear-gradient(135deg, #2e026d 0%, #51127c 100%)', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Montserrat', sans-serif" },
    navbar: { padding: '20px 5%', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', zIndex: 10 },
    mainContent: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1 },
    glassPanel: { background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '35px 25px', borderRadius: '32px', width: '100%', maxWidth: '420px', textAlign: 'center' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    input: { padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', textAlign: 'center', outline: 'none' },
    spinBtn: { padding: '15px', borderRadius: '12px', border: 'none', backgroundColor: '#ffcc33', color: '#5e3a00', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 0 #b99100' }
};

export default Register;