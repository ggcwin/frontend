import React, { useState } from 'react';
import api from '../api'; 
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const navigate = useNavigate();

    const directions = ['fall', 'rise', 'slideRight', 'slideLeft', 'diagonal'];

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!formData.username || !formData.password) {
            return toast.error("Please fill all fields!");
        }

        const loading = toast.loading("Verifying Identity...");
        try {
            const res = await api.post('/api/auth/login', formData);
            
            localStorage.setItem('token', res.data.token); 
            localStorage.setItem('user', JSON.stringify(res.data.user));
            
            toast.success(`Welcome Back, ${res.data.user.username}!`, { id: loading });
            
            if (res.data.user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
            
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid Credentials", { id: loading });
        }
    };

    return (
        <div style={styles.container}>
            <div className="slot-rain">
                {[...Array(25)].map((_, i) => {
                    const randomDir = directions[Math.floor(Math.random() * directions.length)];
                    const isHorizontal = randomDir === 'slideRight' || randomDir === 'slideLeft';

                    const dynamicStyle = {
                        animationName: randomDir,
                        animationDelay: `${Math.random() * 5}s`,
                        fontSize: `${Math.random() * (2.2 - 1.2) + 1.2}rem`,
                        opacity: 0,
                        position: 'absolute'
                    };

                    if (isHorizontal) {
                        dynamicStyle.top = `${Math.random() * 100}%`;
                    } else {
                        dynamicStyle.left = `${Math.random() * 100}%`;
                    }

                    return (
                        <div key={i} className="slot-reel" style={dynamicStyle}>
                            <div className="number-stepper">
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n, idx) => (
                                    <div key={idx}>{n}</div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <nav style={styles.navbar}>
                <h2 style={{ color: '#ffcc33', margin: 0, fontWeight: '900' }}>GGC WIN</h2>
            </nav>

            <div style={styles.mainContent}>
                <div style={styles.glassPanel}>
                    <h1 style={styles.title}>PLAYER LOGIN</h1>
                    <p style={styles.subtitle}>Enter the arena and claim your fortune!</p>

                    <form onSubmit={handleLogin} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <input 
                                type="text" 
                                placeholder="USERNAME" 
                                style={styles.input}
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                required
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <input 
                                type="password" 
                                placeholder="PASSWORD" 
                                style={styles.input}
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                required
                            />
                        </div>

                        {/* ✅ NAYA: Forgot Password Link */}
                        <p 
                            onClick={() => navigate('/forgot-password')} 
                            style={styles.forgotPassword}
                        >
                            Forgot Password?
                        </p>

                        <button type="submit" style={styles.spinBtn}>SPIN TO LOGIN</button>
                    </form>

                    <p style={styles.footerText}>
                        Don't have an account? 
                        <span onClick={() => navigate('/register')} style={styles.link}> REGISTER</span>
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes fall { 0% { transform: translateY(-10vh); opacity: 0; } 10% { opacity: 0.15; } 90% { opacity: 0.15; } 100% { transform: translateY(110vh); opacity: 0; } }
                @keyframes rise { 0% { transform: translateY(110vh); opacity: 0; } 10% { opacity: 0.15; } 90% { opacity: 0.15; } 100% { transform: translateY(-10vh); opacity: 0; } }
                @keyframes slideRight { 0% { transform: translateX(-10vw); opacity: 0; } 10% { opacity: 0.15; } 90% { opacity: 0.15; } 100% { transform: translateX(110vw); opacity: 0; } }
                @keyframes slideLeft { 0% { transform: translateX(110vw); opacity: 0; } 10% { opacity: 0.15; } 90% { opacity: 0.15; } 100% { transform: translateX(-10vw); opacity: 0; } }
                @keyframes diagonal { 0% { transform: translate(-10vw, -10vh); opacity: 0; } 10% { opacity: 0.15; } 90% { opacity: 0.15; } 100% { transform: translate(110vw, 110vh); opacity: 0; } }
                
                @keyframes spin { 0% { transform: translateY(0); } 100% { transform: translateY(-90.9%); } }

                .slot-rain { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
                .slot-reel { animation-duration: 9s; animation-timing-function: linear; animation-iteration-count: infinite; height: 1.2em; overflow: hidden; font-weight: 900; }
                .number-stepper { display: flex; flex-direction: column; animation: spin 2.5s linear infinite; }
                .number-stepper div { height: 1.2em; text-align: center; }
            `}</style>
        </div>
    );
};

const styles = {
    container: { backgroundColor: '#2e026d', backgroundImage: 'linear-gradient(135deg, #2e026d 0%, #51127c 100%)', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', fontFamily: "'Montserrat', sans-serif" },
    navbar: { padding: '20px 5%', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', zIndex: 10 },
    mainContent: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1 },
    glassPanel: { background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '40px 30px', borderRadius: '32px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' },
    title: { color: '#ffcc33', fontSize: '2rem', fontWeight: '900', marginBottom: '10px' },
    subtitle: { color: 'white', opacity: 0.7, fontSize: '0.9rem', marginBottom: '30px' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column' },
    input: { padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem', outline: 'none', textAlign: 'center' },
    
    // ✅ Forgot Password Styling
    forgotPassword: { color: '#ffcc33', cursor: 'pointer', textAlign: 'right', margin: '-10px 0 0 0', fontSize: '0.9rem', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' },
    
    spinBtn: { padding: '15px', borderRadius: '12px', border: 'none', backgroundColor: '#ffcc33', color: '#5e3a00', fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 4px 0 #b99100' },
    footerText: { marginTop: '20px', fontSize: '0.9rem', color: 'white', opacity: 0.8 },
    link: { color: '#ffcc33', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }
};

export default Login;