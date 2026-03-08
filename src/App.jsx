import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// --- MAIN PAGES IMPORT ---
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Deposit from './pages/Deposit'; 
import Withdraw from './pages/Withdraw';
import History from './pages/History';
import Profile from './pages/Profile';
import Transfer from './pages/Transfer';
import BuyTicket from './pages/BuyTicket';
import ForgotPassword from './pages/ForgotPassword';

// --- ADMIN PAGES IMPORT ---
import AdminDashboard from './pages/AdminDashboard'; 
import AdminVoucher from './pages/AdminVoucher';
import AdminSettings from './pages/AdminSettings'; 
import AdminDeposits from './pages/AdminDeposits';
// ✅ Naya VIP Approval Page Import Kiya
import AdminWithdrawals from './pages/AdminWithdrawals'; 
import AdminDraw from './pages/AdminDraw'; 

// ==========================================
// 🛡️ SECURITY GUARD (Protected Route)
// ==========================================
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Toaster 
        position="top-center" 
        reverseOrder={false} 
        toastOptions={{
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }}
      />
      
      <Routes>
        {/* 🔓 PUBLIC ROUTES */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* 🔒 SECURE USER ROUTES */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
        <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/transfer" element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
        <Route path="/buy-ticket" element={<BuyTicket />} />
        
        {/* 👑 SECURE ADMIN ROUTES */}
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/vouchers" element={<ProtectedRoute><AdminVoucher /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
        {/* ✅ Purane AdminWithdraw ko naye AdminWithdrawals se replace kiya */}
        <Route path="/admin/withdrawals" element={<ProtectedRoute><AdminWithdrawals /></ProtectedRoute>} />
        <Route path="/admin/deposits" element={<ProtectedRoute><AdminDeposits /></ProtectedRoute>} />
        <Route path="/admin/draw" element={<ProtectedRoute><AdminDraw /></ProtectedRoute>} />
        
        {/* Ghalat raste par wapas Login par */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;