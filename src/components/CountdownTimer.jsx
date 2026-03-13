import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

// Yeh component props ke zariye Dashboard se 2 functions lega
const CountdownTimer = ({ onLockTickets, onTriggerDraw }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Karachi',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hourCycle: 'h23'
      });

      const parts = formatter.formatToParts(now);
      const getPart = (type) => parts.find(p => p.type === type).value;

      const hour = parseInt(getPart('hour'));
      const minute = parseInt(getPart('minute'));
      const second = parseInt(getPart('second'));

      // 🎁 10:00 PM PKT Notification Alert
      if (hour === 22 && minute === 0 && second === 0) {
          toast('🎁 GGC WIN Alert!\nYour next reward is just an hour away! Stay tuned for the 11 PM draw. 🎯', {
              duration: 10000, icon: '🔔',
              style: { background: '#ffcc33', color: '#5e3a00', fontWeight: 'bold' }
          });
      }

      let targetUTC = new Date(Date.UTC(parseInt(getPart('year')), parseInt(getPart('month')) - 1, parseInt(getPart('day')), 18, 0, 0));

      if (hour >= 23) {
          targetUTC.setUTCDate(targetUTC.getUTCDate() + 1);
      }

      const diff = targetUTC.getTime() - now.getTime();

      // ⏳ Lock buttons 3 minutes before draw (Parent ko signal bhejo)
      if (diff <= 180000 && diff > 0) {
          onLockTickets(true);
      } else {
          onLockTickets(false);
      }

      // 🎰 Trigger Slot at exactly 11:00 PM (Parent ko signal bhejo)
      if (hour === 23 && minute === 0 && second === 0) {
          onTriggerDraw();
      }

      const hh = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const mm = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      const ss = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
      
      setTimeLeft(`${hh}:${mm}:${ss}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [onLockTickets, onTriggerDraw]);

  return (
    <span style={styles.timerChip}>Next Draw: {timeLeft}</span>
  );
};

const styles = {
  timerChip: { 
    backgroundColor: '#ff4b2b', 
    padding: '5px 15px', 
    borderRadius: '20px', 
    fontWeight: 'bold',
    color: 'white'
  }
};

// React.memo isay bewajah re-render hone se bachayega
export default React.memo(CountdownTimer);