import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    // Check karte hain ke kya user ke paas login token hai ya nahi
    const token = localStorage.getItem('token');
    
    // Agar token nahi hai, toh direct Login page par phaink do
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Agar token hai, toh jo page us ne manga hai woh dikha do
    return children;
};

export default ProtectedRoute;