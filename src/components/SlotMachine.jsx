import React, { useState, forwardRef, useImperativeHandle } from 'react';
import api from '../api';
import spinSoundFile from '../assets/slot-sound.mp3';

const SlotMachine = forwardRef(({ onDrawComplete }, ref) => {
  const [show, setShow] = useState(false);
  const [stage, setStage] = useState(0);
  const [digits, setDigits] = useState(['0', '0', '0']);
  const [results, setResults] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [audio] = useState(new Audio(spinSoundFile));

  useImperativeHandle(ref, () => ({
    trigger: async () => {
      if (show) return;
      setShow(true);
      setResults([]);
      audio.loop = true;
      audio.play().catch(() => {});

      let winNums = ['000', '000', '000'];
      try {
        await new Promise(r => setTimeout(r, 3000));
        const todayStr = new Date().toISOString().split('T')[0];
        const res = await api.get(`/api/draw/result-by-date?date=${todayStr}`);
        if (res.data && res.data.winningNumber) {
          winNums = [res.data.winningNumber, res.data.secondWinningNumber || '000', res.data.thirdWinningNumber || '000'];
        }
      } catch (err) {}

      await runSpin(1, winNums[0]);
      await runSpin(2, winNums[1]);
      await runSpin(3, winNums[2]);

      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
        setShow(false);
        setStage(0);
        if (onDrawComplete) onDrawComplete();
      }, 4000);
    }
  }));

  const runSpin = (stageNum, finalNum) => {
    return new Promise(resolve => {
      setStage(stageNum);
      setIsSpinning(true);
      const spinInt = setInterval(() => {
        setDigits([Math.floor(Math.random() * 10).toString(), Math.floor(Math.random() * 10).toString(), Math.floor(Math.random() * 10).toString()]);
      }, 80);

      setTimeout(() => {
        clearInterval(spinInt);
        setDigits(finalNum.split(''));
        setIsSpinning(false);
        setResults(p => [...p, { stage: stageNum, number: finalNum }]);
        setTimeout(resolve, 2000);
      }, 8000);
    });
  };

  if (!show) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.box} className="casino-glow-box">
        <div style={styles.line}></div>
        <h1 style={styles.title}>{stage === 1 ? '🥇 1st' : stage === 2 ? '🥈 2nd' : '🥉 3rd'} Prize</h1>
        <div style={styles.window}>
          {digits.map((d, i) => <div key={i} style={styles.reel} className={isSpinning ? "reels-spinning" : ""}>{d}</div>)}
        </div>
        <p style={styles.subtitle}>Loading Synced Result...</p>
        <div style={styles.board}>
          {results.map((r, i) => (
            <div key={i} style={styles.item}>
              <span>{r.stage} Prize:</span>
              <span style={styles.neon}>#{r.number}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(15px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' },
  box: { position: 'relative', background: 'linear-gradient(145deg, #2a004d 0%, #4a0080 100%)', border: '3px solid rgba(255, 204, 51, 0.8)', borderRadius: '35px', padding: '40px 30px', textAlign: 'center', width: '90%', maxWidth: '380px' },
  line: { position: 'absolute', top: '2px', left: '10%', width: '80%', height: '4px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)', borderRadius: '10px' },
  title: { color: '#fff', fontSize: '2rem', marginBottom: '25px', fontWeight: '900', textShadow: '0 0 15px rgba(255, 204, 51, 1), 0 2px 4px rgba(0,0,0,0.8)', letterSpacing: '2px' },
  window: { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '25px', background: '#0a001a', padding: '25px 20px', borderRadius: '25px', border: '2px solid #222', boxShadow: 'inset 0 15px 30px rgba(0,0,0,0.9), 0 2px 0 rgba(255,255,255,0.1)' },
  reel: { width: '70px', height: '100px', background: 'linear-gradient(180deg, #d0d0d0 0%, #ffffff 40%, #ffffff 60%, #a0a0a0 100%)', color: '#111', fontSize: '4.5rem', fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '12px', border: '1px solid #555', boxShadow: '0 8px 15px rgba(0,0,0,0.6), inset 0 10px 10px rgba(0,0,0,0.1)', textShadow: '0 3px 5px rgba(0,0,0,0.3)' },
  subtitle: { color: '#00baf2', fontSize: '1.1rem', marginBottom: '25px', fontWeight: 'bold', letterSpacing: '1px', textShadow: '0 0 10px rgba(0, 186, 242, 0.6)' },
  board: { display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' },
  item: { display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', color: '#ddd' },
  neon: { color: '#00e676', textShadow: '0 0 10px rgba(0, 230, 118, 0.8)' }
};

export default SlotMachine;