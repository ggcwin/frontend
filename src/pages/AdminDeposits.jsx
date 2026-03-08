import React, { useState, useEffect } from 'react';
import api from '../api'; 
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminDeposits = () => {
    const [deposits, setDeposits] = useState([]);
    const navigate = useNavigate();

    // Backend se Pending Deposits mangwana
    const fetchPendingDeposits = async () => {
        try {
            // Note: Make sure aap ki wallet routes '/api/wallet' par mount hain backend mein
            const res = await api.get('/api/wallet/admin/pending-deposits');
            setDeposits(res.data);
        } catch (err) {
            toast.error("Failed to load pending deposits");
        }
    };

    useEffect(() => {
        fetchPendingDeposits();
    }, []);

    // Approve Button Dabaney Par
    const handleApprove = async (transactionId) => {
        const loading = toast.loading("Approving and adding funds securely...");
        try {
            const res = await api.post('/api/wallet/admin/approve-deposit', { transactionId });
            toast.success(res.data.message, { id: loading });
            fetchPendingDeposits(); // Approve hone ke baad list ko refresh karo
        } catch (err) {
            toast.error(err.response?.data?.message || "Approval failed", { id: loading });
        }
    };

    return (
        <div style={styles.container}>
            <nav style={styles.navbar}>
                <h2 style={{ color: '#00e676', margin: 0 }}>💰 PENDING DEPOSITS</h2>
                <button onClick={() => navigate('/admin/dashboard')} style={styles.backBtn}>Back to Dashboard</button>
            </nav>

            <div style={styles.mainContent}>
                <h1 style={{ marginBottom: '10px' }}>Approve Player Funds</h1>
                <p style={{ opacity: 0.8, marginBottom: '30px' }}>
                    Review TRC20 Hashes submitted by players. Clicking 'Approve' will automatically and securely credit the exact amount to their Play Balance.
                </p>

                {deposits.length === 0 ? (
                    <div style={styles.emptyBox}>
                        <h2>🎉 All Clear!</h2>
                        <p>There are no pending deposit requests at the moment.</p>
                    </div>
                ) : (
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Player Info</th>
                                    <th style={styles.th}>Amount ($)</th>
                                    <th style={styles.th}>TRC20 Hash (Proof)</th>
                                    <th style={styles.th}>Date</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deposits.map(d => (
                                    <tr key={d._id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <b>{d.userId?.username || "Unknown"}</b><br/>
                                            <small style={{opacity: 0.6}}>{d.userId?.email || ""}</small>
                                        </td>
                                        <td style={{...styles.td, color: '#00e676', fontWeight: '900', fontSize: '1.2rem'}}>
                                            ${d.amount}
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.hashBadge}>
                                                {d.details.replace('TRC20 Hash: ', '')}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            {new Date(d.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={styles.td}>
                                            <button onClick={() => handleApprove(d._id)} style={styles.approveBtn}>
                                                ✅ APPROVE
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { backgroundColor: '#121212', color: 'white', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif" },
    navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', backgroundColor: '#1e1e1e', borderBottom: '2px solid #333' },
    backBtn: { background: 'none', border: '1px solid #ffcc33', color: '#ffcc33', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    mainContent: { maxWidth: '1000px', margin: '40px auto', padding: '0 20px' },
    emptyBox: { backgroundColor: '#1e1e1e', padding: '50px', borderRadius: '20px', textAlign: 'center', border: '1px dashed #444', color: '#888' },
    tableContainer: { overflowX: 'auto', backgroundColor: '#1e1e1e', borderRadius: '15px', padding: '20px', border: '1px solid #333', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    th: { padding: '15px', borderBottom: '2px solid #444', color: '#ffcc33', fontWeight: 'bold', whiteSpace: 'nowrap' },
    td: { padding: '15px', borderBottom: '1px solid #333', whiteSpace: 'nowrap' },
    tr: { transition: '0.3s' },
    hashBadge: { backgroundColor: 'rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '5px', fontSize: '0.85rem', fontFamily: 'monospace', color: '#bbb' },
    approveBtn: { padding: '10px 15px', backgroundColor: '#00e676', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,230,118,0.3)' }
};

export default AdminDeposits;