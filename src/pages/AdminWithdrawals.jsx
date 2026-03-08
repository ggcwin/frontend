import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminWithdrawals = () => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const res = await api.get(`/api/admin/withdrawals?status=${filter}`);
      setRequests(res.data);
    } catch (err) {
      toast.error("Failed to load withdrawal requests");
    }
  };

  const handleAction = async (id, action) => {
    const loading = toast.loading(`${action === 'approved' ? 'Approving' : 'Rejecting'}...`);
    try {
      await api.post(`/api/admin/withdraw/action`, { requestId: id, status: action });
      toast.success(`Request ${action} successfully!`, { id: loading });
      fetchRequests(); // List refresh karein
    } catch (err) {
      toast.error("Operation failed", { id: loading });
    }
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <h2 style={{color: '#ffcc33'}}>🏦 WITHDRAWAL MANAGEMENT</h2>
        <button onClick={() => navigate('/admin/dashboard')} style={styles.backBtn}>← Back</button>
      </nav>

      <div style={styles.mainContent}>
        {/* Filters */}
        <div style={styles.filterBar}>
          {['pending', 'approved', 'rejected'].map(s => (
            <button 
              key={s} 
              onClick={() => setFilter(s)}
              style={{...styles.filterBtn, backgroundColor: filter === s ? '#ffcc33' : 'rgba(255,255,255,0.1)', color: filter === s ? '#000' : '#fff'}}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Request List */}
        <div style={styles.listContainer}>
          {requests.length === 0 ? (
            <p style={{textAlign: 'center', padding: '40px', opacity: 0.5}}>No {filter} requests found.</p>
          ) : (
            requests.map((req, i) => (
              <div key={i} style={styles.reqCard}>
                <div style={styles.reqInfo}>
                  <h4 style={{margin: '0 0 5px 0', color: '#ffcc33'}}>👤 {req.username}</h4>
                  <p style={styles.detailText}>💰 Amount: <b>${req.amount}</b></p>
                  <p style={styles.detailText}>🏛️ Method: <b>{req.method}</b></p>
                  <p style={{...styles.detailText, color: '#00baf2'}}>📍 Address: {req.walletAddress}</p>
                  <span style={styles.dateText}>{new Date(req.createdAt).toLocaleString()}</span>
                </div>

                {filter === 'pending' && (
                  <div style={styles.actionGroup}>
                    <button onClick={() => handleAction(req._id, 'approved')} style={styles.approveBtn}>APPROVE</button>
                    <button onClick={() => handleAction(req._id, 'rejected')} style={styles.rejectBtn}>REJECT</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#121212', minHeight: '100vh', color: 'white', fontFamily: "'Montserrat', sans-serif" },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 5%', backgroundColor: '#1e1e1e', borderBottom: '2px solid #333' },
  backBtn: { background: 'none', border: '1px solid #ffcc33', color: '#ffcc33', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' },
  mainContent: { maxWidth: '900px', margin: '30px auto', padding: '0 20px' },
  filterBar: { display: 'flex', gap: '10px', marginBottom: '30px' },
  filterBtn: { flex: 1, padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '15px' },
  reqCard: { backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '15px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  detailText: { margin: '3px 0', fontSize: '0.9rem', opacity: 0.9 },
  dateText: { fontSize: '0.75rem', opacity: 0.5 },
  actionGroup: { display: 'flex', gap: '10px' },
  approveBtn: { backgroundColor: '#00e676', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  rejectBtn: { backgroundColor: '#ff4b2b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }
};

export default AdminWithdrawals;