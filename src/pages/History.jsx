import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    // 🔍 FILTERS STATE
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedWallet, setSelectedWallet] = useState(location.state?.filterWallet || 'all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                if (!user) return navigate('/');

                const res = await api.get(`/api/transaction/history/${user._id}`);
                setHistory(res.data);
                setLoading(false);
            } catch (err) {
                toast.error("Failed to load transaction history");
                setLoading(false);
            }
        };
        fetchHistory();
    }, [navigate]);

    // 🎯 FILTER LOGIC
    const filteredData = history.filter(item => {
        const itemDate = new Date(item.createdAt).toISOString().split('T')[0];
        
        // Date Filter
        const dateMatch = (!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate);
        
        // Wallet Filter (Details mein check karta hai ke kaunsa wallet use hua)
        const walletMatch = selectedWallet === 'all' || 
                           item.details.toLowerCase().includes(selectedWallet.toLowerCase()) ||
                           item.type.toLowerCase().includes(selectedWallet.toLowerCase());

        // Search Match
        const searchMatch = item.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.type.toLowerCase().includes(searchTerm.toLowerCase());

        return dateMatch && walletMatch && searchMatch;
    });

    return (
        <div style={styles.container}>
            <nav style={styles.navbar}>
                <h2 style={styles.navLogo} onClick={() => navigate('/dashboard')}>GGC WIN</h2>
                <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>← Back to Dashboard</button>
            </nav>

            <div style={styles.content}>
                <h1 style={styles.title}>📜 Transaction History</h1>

                {/* 📂 FILTERS SECTION */}
                <div style={styles.filterCard}>
                    <div style={styles.filterGrid}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Start Date</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles.input} />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>End Date</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={styles.input} />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Filter by Wallet</label>
                            <select value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)} style={styles.select}>
                                <option value="all">All Wallets</option>
                                <option value="deposit">Play Balance</option>
                                <option value="win">Win Wallet</option>
                                <option value="reward">Reward/Bonus</option>
                            </select>
                        </div>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search by details (e.g. Ticket #316)..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        style={{...styles.input, marginTop: '15px', width: '96%'}}
                    />
                </div>

                {/* 📊 DATA TABLE */}
                <div style={styles.tableWrapper}>
                    {loading ? (
                        <p style={styles.msg}>Loading your records...</p>
                    ) : filteredData.length === 0 ? (
                        <p style={styles.msg}>No records found for the selected filters.</p>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Date & Time</th>
                                    <th style={styles.th}>Type</th>
                                    <th style={styles.th}>Details</th>
                                    <th style={styles.th}>Amount</th>
                                    <th style={styles.th}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((item, i) => (
                                    <tr key={i} style={styles.tr}>
                                        <td style={styles.td}>
                                            {new Date(item.createdAt).toLocaleDateString()}<br/>
                                            <small style={{opacity: 0.6}}>{new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                                        </td>
                                        <td style={{...styles.td, textTransform: 'capitalize', fontWeight: 'bold', color: '#00baf2'}}>
                                            {item.type}
                                        </td>
                                        <td style={styles.td}>{item.details}</td>
                                        <td style={{...styles.td, color: item.amount > 0 && item.type !== 'purchase' ? '#00e676' : '#ff4b2b', fontWeight: 'bold'}}>
                                            {item.amount > 0 && item.type !== 'purchase' ? '+' : ''}${Number(item.amount).toFixed(2)}
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.badge}>{item.status.toUpperCase()}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { backgroundColor: '#2e026d', backgroundImage: 'linear-gradient(135deg, #2e026d 0%, #51127c 100%)', color: 'white', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif" },
    navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', backgroundColor: 'rgba(0,0,0,0.3)' },
    navLogo: { color: '#ffcc33', fontWeight: '900', cursor: 'pointer' },
    backBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' },
    content: { maxWidth: '1000px', margin: '40px auto', padding: '0 20px' },
    title: { textAlign: 'center', marginBottom: '30px', fontWeight: '900', color: '#ffcc33' },
    filterCard: { backgroundColor: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '20px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' },
    filterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '0.8rem', fontWeight: 'bold', color: '#ffcc33' },
    input: { padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' },
    select: { padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' },
    tableWrapper: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '20px', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    th: { padding: '15px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffcc33', fontSize: '0.9rem' },
    tr: { borderBottom: '1px solid rgba(255,255,255,0.05)' },
    td: { padding: '15px', fontSize: '0.85rem' },
    badge: { backgroundColor: 'rgba(0, 230, 118, 0.2)', color: '#00e676', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold' },
    msg: { textAlign: 'center', padding: '40px', opacity: 0.5 }
};

export default History;