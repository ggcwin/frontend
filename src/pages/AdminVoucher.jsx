import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminVoucher = () => {
    const [vouchers, setVouchers] = useState([]);
    const navigate = useNavigate();

    // Vouchers backend se mangwana
    const fetchVouchers = async () => {
        try {
            const res = await api.get('/api/vouchers'); 
            // Agar data undefined hai toh khali array set karo taake page crash na ho
            setVouchers(res.data || []); 
        } catch (err) {
            toast.error("Failed to load vouchers");
            setVouchers([]);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, []);

    const generateVoucher = async () => {
        const loading = toast.loading("Generating VIP Voucher...");
        try {
            const res = await api.post('/api/vouchers/generate');
            toast.success("Voucher Generated!", { id: loading });
            fetchVouchers(); // Naya aane par list update karo
        } catch (err) {
            toast.error("Generation failed", { id: loading });
        }
    };

    return (
        <div style={styles.container}>
            <nav style={styles.navbar}>
                <h2 style={{ color: '#ffcc33', margin: 0 }}>🎟️ VIP VOUCHERS</h2>
                <button onClick={() => navigate('/admin/dashboard')} style={styles.backBtn}>Back to Dashboard</button>
            </nav>

            <div style={styles.mainContent}>
                <button onClick={generateVoucher} style={styles.generateBtn}>
                    + GENERATE NEW VOUCHER
                </button>

                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Voucher Code</th>
                                <th style={styles.th}>Amount</th>
                                <th style={styles.th}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vouchers.length === 0 ? (
                                <tr><td colSpan="3" style={{textAlign: 'center', padding: '20px'}}>No Vouchers Found</td></tr>
                            ) : (
                                vouchers.map((v) => (
                                    <tr key={v._id}>
                                        <td style={styles.td}><b>{v.code}</b></td>
                                        <td style={{...styles.td, color: '#00e676'}}>${v.amount}</td>
                                        <td style={styles.td}>{v.isUsed ? '🔴 Used' : '🟢 Active'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { backgroundColor: '#121212', color: 'white', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif" },
    navbar: { display: 'flex', justifyContent: 'space-between', padding: '15px 5%', backgroundColor: '#1e1e1e', borderBottom: '2px solid #333' },
    backBtn: { background: 'transparent', border: '1px solid #ffcc33', color: '#ffcc33', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' },
    mainContent: { maxWidth: '800px', margin: '40px auto', padding: '0 20px' },
    generateBtn: { padding: '15px 20px', backgroundColor: '#ffcc33', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px', width: '100%' },
    tableContainer: { backgroundColor: '#1e1e1e', borderRadius: '15px', padding: '20px' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    th: { padding: '15px', borderBottom: '2px solid #444', color: '#ffcc33' },
    td: { padding: '15px', borderBottom: '1px solid #333' }
};

export default AdminVoucher;