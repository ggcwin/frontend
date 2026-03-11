import React, { useState, useEffect } from 'react';
import api from '../api'; 
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminDraw = () => {
  const [winners, setWinners] = useState(['', '', '']);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✨ NAYA: Filters aur Report ke States ✨
  const [filterType, setFilterType] = useState('unsold');
  const [selectedDate, setSelectedDate] = useState('');
  const [numbersData, setNumbersData] = useState({ sold: [], unsold: [], repeated: [] });
  const [totalSold, setTotalSold] = useState(0);

  // 📡 Backend se Data Mangwana (Date ke hisab se)
  const fetchDrawData = async () => {
    setLoading(true);
    try {
      // 1. Lock kiye hue numbers check karna
      const settingsRes = await api.get('/api/admin/current-winners');
      if (settingsRes.data && settingsRes.data.isRigged) {
        setWinners(settingsRes.data.nextWinners);
      }

      // 2. Numbers Report (Sold, Unsold, Repeated) lana
      const url = selectedDate ? `/api/admin/numbers-report?date=${selectedDate}` : '/api/admin/numbers-report';
      const res = await api.get(url);
      setNumbersData(res.data);
      setTotalSold(res.data.sold ? res.data.sold.length : 0);

      setLoading(false);
    } catch (err) {
      toast.error("Failed to load draw data");
      setLoading(false);
    }
  };

  // Jab bhi Date change ho, naya data fetch ho
  useEffect(() => {
    fetchDrawData();
  }, [selectedDate]);

  // 🔒 Winning Numbers Lock karne ka function
  const handleSetWinners = async (e) => {
    e.preventDefault();
    if (winners.some(w => w.length !== 3)) {
      return toast.error("Please enter exactly 3 digits for all prizes!");
    }

    const loadToast = toast.loading("Locking winning numbers...");
    try {
      const res = await api.post('/api/admin/set-winners', { winners });
      toast.success(res.data.message || "Winning numbers locked! 🔒", { id: loadToast });
    } catch (err) {
      toast.error("Failed to lock numbers. Backend check karein!", { id: loadToast });
    }
  };

  // 📥 EXPORT TO EXCEL (.CSV)
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (filterType === 'repeated') {
        csvContent += "Number,Times Sold\n";
        numbersData.repeated.forEach(row => {
            csvContent += `${row.number},${row.count}\n`;
        });
    } else {
        csvContent += "Ticket Number\n";
        const targetArray = filterType === 'sold' ? numbersData.sold : numbersData.unsold;
        targetArray.forEach(num => {
            csvContent += `${num}\n`;
        });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GGC_Numbers_${filterType}_${selectedDate || 'Today'}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <h2 style={{ color: '#ffcc33', margin: 0 }}>🎯 DRAW CONTROL & NUMBER LOCK</h2>
        <button onClick={() => navigate('/admin/dashboard')} style={styles.backBtn}>Back to Dashboard</button>
      </nav>

      <div style={styles.mainContent}>
        
        {/* --- 👑 NUMBER LOCK SECTION --- */}
        <div style={styles.card}>
          <h1 style={{ color: '#ffcc33', textAlign: 'center', marginBottom: '10px' }}>Pre-Select Winners</h1>
          <p style={{ textAlign: 'center', opacity: 0.8, marginBottom: '30px' }}>
            Enter the 3-digit numbers you want the slot machine to announce at 11:00 PM.
          </p>
          
          <form onSubmit={handleSetWinners} style={styles.form}>
            <div style={styles.inputsGrid}>
              {winners.map((val, i) => (
                <div key={i} style={styles.inputGroup}>
                  <label style={styles.label}>{i === 0 ? '🥇 1st Prize' : i === 1 ? '🥈 2nd Prize' : '🥉 3rd Prize'}</label>
                  <input 
                    type="text" 
                    placeholder="000" 
                    style={styles.drawInput}
                    value={val}
                    onChange={(e) => {
                      const newWinners = [...winners];
                      newWinners[i] = e.target.value.replace(/\D/g, '').slice(0, 3);
                      setWinners(newWinners);
                    }}
                    required
                  />
                </div>
              ))}
            </div>
            <button type="submit" style={styles.lockBtn}>🔒 LOCK WINNING NUMBERS</button>
          </form>
        </div>

        {/* --- 📊 NUMBERS REPORT & FILTER SECTION --- */}
        <div style={{...styles.card, marginTop: '30px'}}>
          
          <div style={styles.filterHeader}>
            <div>
                <h2 style={{color: '#00e676', margin: 0}}>📊 Numbers Report</h2>
                <p style={{opacity: 0.8, marginTop: '5px', fontSize: '0.9rem'}}>
                    Total Tickets Sold: <b>{totalSold}</b>
                </p>
            </div>
            
            {/* ✨ YAHAN HAI AAP KA DROPDOWN AUR DATE FILTER ✨ */}
            <div style={styles.controlsWrapper}>
                <input 
                    type="date" 
                    style={styles.controlInput}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />
                
                <select 
                    style={styles.controlInput}
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="unsold">Unsold Numbers ({numbersData.unsold.length})</option>
                    <option value="sold">Sold Numbers ({numbersData.sold.length})</option>
                    <option value="repeated">Repeated Numbers (Top)</option>
                </select>

                <button onClick={exportToCSV} style={styles.exportBtn}>
                    📥 Export .CSV
                </button>
            </div>
          </div>
          
          <div style={styles.numbersBox}>
            {loading ? <p style={{padding: '20px'}}>Loading Data...</p> : (
                <>
                    {filterType === 'unsold' && numbersData.unsold.map((num, i) => (
                        <span key={i} style={{...styles.badge, color: '#00e676', borderColor: '#00e676'}}>{num}</span>
                    ))}

                    {filterType === 'sold' && numbersData.sold.map((num, i) => (
                        <span key={i} style={{...styles.badge, color: '#ff4b2b', borderColor: '#ff4b2b'}}>{num}</span>
                    ))}

                    {filterType === 'repeated' && numbersData.repeated.map((item, i) => (
                        <div key={i} style={styles.repeatedBadge}>
                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>{item.number}</span>
                            <span style={{ fontSize: '12px', color: '#ffcc33' }}>Sold: {item.count}x</span>
                        </div>
                    ))}

                    {(filterType === 'sold' && numbersData.sold.length === 0) && <p style={{padding: '20px', color: 'gray'}}>No tickets sold yet.</p>}
                    {(filterType === 'repeated' && numbersData.repeated.length === 0) && <p style={{padding: '20px', color: 'gray'}}>No numbers repeated yet.</p>}
                </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#121212', color: 'white', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif", paddingBottom: '50px' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', backgroundColor: '#1e1e1e', borderBottom: '2px solid #333' },
  backBtn: { background: 'none', border: '1px solid #ffcc33', color: '#ffcc33', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  mainContent: { maxWidth: '900px', margin: '40px auto', padding: '0 20px' },
  card: { backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid #333' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' },
  label: { color: '#ffcc33', fontSize: '0.9rem', fontWeight: 'bold' },
  drawInput: { padding: '15px', borderRadius: '10px', border: '1px solid #444', backgroundColor: '#000', color: '#ffcc33', fontSize: '2rem', textAlign: 'center', fontWeight: '900', outline: 'none' },
  lockBtn: { padding: '18px', borderRadius: '10px', border: 'none', backgroundColor: '#ff4b2b', color: 'white', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', marginTop: '10px', boxShadow: '0 5px 15px rgba(255, 75, 43, 0.3)' },
  
  // Filter Section Styles
  filterHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '20px' },
  controlsWrapper: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  controlInput: { padding: '8px 12px', borderRadius: '8px', backgroundColor: '#2a2a2a', color: 'white', border: '1px solid #444', outline: 'none', fontSize: '0.95rem' },
  exportBtn: { padding: '8px 15px', backgroundColor: '#00baf2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0, 186, 242, 0.3)' },
  
  // Grid Styles
  numbersBox: { display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '350px', overflowY: 'auto', backgroundColor: '#000', padding: '15px', borderRadius: '10px', border: '1px solid #333' },
  badge: { backgroundColor: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid', fontWeight: 'bold' },
  repeatedBadge: { padding: '8px 15px', backgroundColor: '#2a2a2a', borderLeft: '4px solid #ffcc33', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center' }
};

export default AdminDraw;