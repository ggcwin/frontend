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
            // ✅ FIX: Endpoint theek kar diya (/api/voucher)
            const res = await api.get('/api/voucher'); 
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
        // ✅ FIX: Ab button dabane par pehle amount aur tadad (count) poocha jayega
        const amountVal = prompt("Enter Voucher Amount ($):", "100");
        if (!amountVal || isNaN(amountVal)) return toast.error("Invalid Amount!");
        
        const countVal = prompt("How many vouchers to generate?", "1");
        if (!countVal || isNaN(countVal)) return toast.error("Invalid Count!");

        const loading = toast.loading("Generating VIP Voucher...");
        try {
            // ✅ FIX: Backend ko Amount aur Count send kiya gaya
            const res = await api.post('/api/voucher/generate', {
                amount: Number(amountVal),
                count: Number(countVal)
            });
            toast.success(`${countVal} Voucher(s) Generated!`, { id: loading });
            fetchVouchers(); 
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
                                vouchers.map((v) => {
                                    // ✅ FIX: Check karega ke voucher use hua hai ya nahi
                                    const isRedeemed = v.status === 'used' || v.status === 'Redeemed' || v.usedBy;
                                    
                                    return (
                                        <tr key={v._id}>
                                            <td style={styles.td}><b>{v.code}</b></td>
                                            <td style={{...styles.td, color: '#00e676'}}>${v.amount}</td>
                                            <td style={styles.td}>
                                                {/* ✅ NAYA: Laal rang mein Username dikhayega */}
                                                {isRedeemed ? (
                                                    <span style={{ color: '#ff4b2b', fontWeight: 'bold' }}>
                                                        🔴 Redeemed by '{v.usedBy?.username || 'Unknown'}'
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#00e676', fontWeight: 'bold' }}>
                                                        🟢 Active
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
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
    tableContainer: { backgroundColor: '#1e1e1e', borderRadius: '15px', padding: '20px', overflowX: 'auto' }, 
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' },
    th: { padding: '15px', borderBottom: '2px solid #444', color: '#ffcc33' },
    td: { padding: '15px', borderBottom: '1px solid #333' }
};

export default AdminVoucher;