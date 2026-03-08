import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png'; // 👈 Check karein ke logo isi naam se hai

const Navbar = ({ title }) => {
  const navigate = useNavigate();

  return (
    <nav style={styles.navbar}>
      <div style={styles.logoContainer} onClick={() => navigate('/dashboard')}>
        <img src={logo} alt="GGC Logo" style={styles.logoImg} />
        {title && <h2 style={styles.navTitle}>{title}</h2>}
      </div>
      
      {/* Timer ya koi aur button yahan aa sakta hai */}
      <div style={styles.rightSection}>
        {/* Aapka timer wala div yahan Dashboard se move kiya ja sakta hai */}
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 5%',
    backgroundColor: '#1e1e1e', // Dashboard wala dark color
    zIndex: 100
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    cursor: 'pointer'
  },
  logoImg: {
    height: '45px', // Logo ka size yahan se set karein
    width: 'auto'
  },
  navTitle: {
    margin: 0,
    color: '#ffcc33',
    fontSize: '1.2rem'
  }
};

export default Navbar;