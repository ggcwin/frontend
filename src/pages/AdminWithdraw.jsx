import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const AdminWithdraw = () => {
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/api/withdraw/all');
      setRequests(res.data);
    } catch (err) {
      toast.error("Could not load requests");
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleStatus = async (withdrawId, status) => {
    const loading = toast.loading(`Processing ${status}...`);
    try {
      await api.post('/api/withdraw/update-status', { withdrawId, status });
      toast.success(`Request ${status}!`, { id: loading });
      fetchRequests(); // List refresh karna
    } catch (err) {
      toast.error("Action failed", { id: loading });
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={{color: '#ffcc33', marginBottom: '30px'}}>🏦 WITHDRAWAL REQUESTS</h1>
      
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th>Date</th>
              <th>User ID</th>
              <th>Method</th>
              <th>Details</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req, i) => (
              <tr key={i} style={styles.row}>
                <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                <td style={{fontSize: '0.8rem', opacity: 0.7}}>{req.userId}</td>
                <td><b>{req.method}</b></td>
                <td>{req.accountDetails}</td>
                <td style={{color: '#00e676', fontWeight: 'bold'}}>${req.amount}</td>
                <td>
                  <span style={req.status === 'Pending' ? styles.statusPending : styles.statusDone}>
                    {req.status}
                  </span>
                </td>
                <td>
                  {req.status === 'Pending' && (
                    <div style={{display: 'flex', gap: '5px'}}>
                      <button onClick={() => handleStatus(req._id, 'Approved')} style={styles.approveBtn}>✓</button>
                      <button onClick={() => handleStatus(req._id, 'Rejected')} style={styles.rejectBtn}>✕</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && <p style={{textAlign: 'center', padding: '20px'}}>No requests found.</p>}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '40px 5%', backgroundColor: '#121212', minHeight: '100vh', color: 'white' },
  tableCard: { backgroundColor: '#1e1e1e', borderRadius: '15px', overflowX: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  headerRow: { backgroundColor: '#252525', color: '#888' },
  row: { borderBottom: '1px solid #333' },
  statusPending: { color: '#ffcc33', backgroundColor: 'rgba(255,204,51,0.1)', padding: '4px 8px', borderRadius: '4px' },
  statusDone: { color: '#888', opacity: 0.6 },
  approveBtn: { backgroundColor: '#00e676', border: 'none', color: 'black', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  rejectBtn: { backgroundColor: '#ff4b2b', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
};
// Table th/td padding
styles.table.th = { padding: '15px' };
styles.row.td = { padding: '15px' };

export default AdminWithdraw;