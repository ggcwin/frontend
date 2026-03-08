import React, { useState, useEffect } from 'react';
import api from '../api'; // ✅ axios ki jagah api import kiya
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const History = () => {
  const [activeTab, setActiveTab] = useState('transactions'); 
  const [transactions, setTransactions] = useState([]);
  const [winners, setWinners] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return navigate('/');

    const fetchData = async () => {
      try {
        // ✅ Lambe links khatam
        const [transRes, winRes] = await Promise.all([
          api.get(`/api/transaction/${user._id}`),
          api.get(`/api/ticket/winners/recent`)
        ]);
        setTransactions(transRes.data);
        setWinners(winRes.data);
      } catch (err) {
        toast.error("Failed to load history data");
      }
    };
    fetchData();
  }, [navigate]);

  const filteredTransactions = transactions.filter(t => 
    t.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(t.date).toLocaleDateString().includes(searchTerm)
  );

  const filteredWinners = winners.filter(w => 
    w.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.number.includes(searchTerm) ||
    w.date.includes(searchTerm)
  );

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <h2 style={{color: '#ffcc33', margin: 0}}>GGC ACTIVITY LOG</h2>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>← Dashboard</button>
      </nav>

      <div style={styles.content}>
        <div style={styles.controls}>
          <input 
            type="text" 
            placeholder="Search by date, type, or number..." 
            style={styles.searchBar}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div style={styles.tabGroup}>
            <button 
              onClick={() => setActiveTab('transactions')} 
              style={activeTab === 'transactions' ? styles.activeTab : styles.tab}
            >My History</button>
            <button 
              onClick={() => setActiveTab('winners')} 
              style={activeTab === 'winners' ? styles.activeTab : styles.tab}
            >Winner Board</button>
          </div>
        </div>

        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                {activeTab === 'transactions' ? (
                  <><th>Date</th><th>Type</th><th>Details</th><th>Amount</th><th>Status</th></>
                ) : (
                  <><th>Date</th><th>Winner</th><th>Number</th><th>Prize</th></>
                )}
              </tr>
            </thead>
            <tbody>
              {activeTab === 'transactions' ? (
                filteredTransactions.map((t, i) => (
                  <tr key={i} style={styles.row}>
                    <td>{new Date(t.date).toLocaleDateString()}</td>
                    <td style={{textTransform: 'capitalize', color: '#00baf2'}}>{t.type.replace('_', ' ')}</td>
                    <td>{t.details}</td>
                    <td style={{color: '#00e676', fontWeight: 'bold'}}>${Math.floor(t.amount)}</td>
                    <td><span style={t.status === 'completed' ? styles.success : styles.pending}>{t.status}</span></td>
                  </tr>
                ))
              ) : (
                filteredWinners.map((w, i) => (
                  <tr key={i} style={styles.row}>
                    <td>{w.date}</td>
                    <td style={{color: '#ffcc33'}}>{w.username}</td>
                    <td style={{fontWeight: '900', fontSize: '1.1rem'}}>{w.number}</td>
                    <td style={{color: '#00e676'}}>{w.prize}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {(activeTab === 'transactions' ? filteredTransactions : filteredWinners).length === 0 && (
            <p style={{textAlign: 'center', padding: '40px', opacity: 0.5}}>No records found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#121212', color: 'white', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif" },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', backgroundColor: '#1e1e1e', borderBottom: '1px solid #333' },
  backBtn: { background: 'none', border: '1px solid #ffcc33', color: '#ffcc33', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' },
  content: { maxWidth: '1000px', margin: '30px auto', padding: '0 20px' },
  controls: { display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' },
  searchBar: { padding: '15px', borderRadius: '12px', border: '1px solid #444', backgroundColor: '#222', color: 'white', fontSize: '1rem', outline: 'none' },
  tabGroup: { display: 'flex', gap: '10px' },
  tab: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#222', color: 'white', cursor: 'pointer', fontWeight: 'bold' },
  activeTab: { flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#ffcc33', color: '#5e3a00', cursor: 'pointer', fontWeight: 'bold' },
  tableCard: { backgroundColor: '#1e1e1e', borderRadius: '15px', overflowX: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  headerRow: { backgroundColor: '#252525', color: '#888', fontSize: '0.85rem' },
  row: { borderBottom: '1px solid #333', fontSize: '0.9rem' },
  success: { color: '#00e676', backgroundColor: 'rgba(0, 230, 118, 0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' },
  pending: { color: '#ffcc33', backgroundColor: 'rgba(255, 204, 51, 0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }
};
styles.table.th = { padding: '15px' };
styles.row.td = { padding: '15px' };

export default History;