import ganeshImg from '../assets/ganesh.jpeg';
import React, { useState, useEffect } from 'react';

export default function App() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [confirmedToken, setConfirmedToken] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // 🎯 DRAW DATE: 25th at 1:00 PM (month 8 = September)
  const DRAW_DATE = new Date(new Date().getFullYear(), 8, 25, 13, 0, 0);

  // ⏳ Countdown
  useEffect(() => {
    const tick = () => {
      const distance = DRAW_DATE.getTime() - new Date().getTime();
      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      alert('Failed to load payment gateway');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/token/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone })
      });
      const data = await res.json();

      if (!data.success) {
        alert('Order creation failed');
        setLoading(false);
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: 'INR',
        name: 'Gaddiannaram Utsav Samithi',
        description: 'Ganesh Chaturthi Token Fee ₹20',
        order_id: data.orderId,
        prefill: { name, contact: phone },
        theme: { color: '#e65100' },
        handler: async function (response) {
          const verifyRes = await fetch('http://localhost:5000/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              tokenNo: data.tokenNo
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setIsPaid(true);
            setWhatsappUrl(verifyData.whatsappUrl);
            setConfirmedToken(verifyData.tokenDetails);
          } else {
            alert('Payment verification failed!');
          }
          setLoading(false);
        },
        modal: { ondismiss: () => setLoading(false) }
      };

      new window.Razorpay(options).open();
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Try again.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        ...styles.root,
        backgroundImage: `url(${ganeshImg})`
      }}
    >
      {/* Dark overlay to keep text readable over image */}
      <div style={styles.bgOverlay} />

      {/* ============ CONTENT ============ */}
      <div style={styles.content}>

        {/* 🖼️ STEP 1: TOP IMAGE — FULL WIDTH + FULL HEIGHT */}
        <div style={styles.topImageWrap}>
          <img
            src={ganeshImg}
            alt="Ganesh Idol"
            style={styles.topImage}
          />
        </div>

        {/* 🏷️ STEP 2: EVENT NAME BELOW IMAGE (transparent bg) */}
        <div style={styles.headerSection}>
          <h1 style={styles.eventName}>🪔 Gaddiannaram Utsav Samithi 🪔</h1>
          <p style={styles.eventLocation}>📍 Gaddiannaram, Dilsukhnagar, Hyderabad</p>
        </div>

        {/* ⏳ STEP 3: COUNTDOWN (transparent glass) */}
        <div style={styles.countdownSection}>
          <p style={styles.countdownLabel}>🎯 Draw Date: 25th at 1:00 PM</p>
          <div style={styles.countdownGrid}>
            <div style={styles.timeBlock}>
              <span style={styles.timeNum}>{timeLeft.days}</span>
              <span style={styles.timeLabel}>Days</span>
            </div>
            <div style={styles.timeBlock}>
              <span style={styles.timeNum}>{String(timeLeft.hours).padStart(2, '0')}</span>
              <span style={styles.timeLabel}>Hours</span>
            </div>
            <div style={styles.timeBlock}>
              <span style={styles.timeNum}>{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span style={styles.timeLabel}>Min</span>
            </div>
            <div style={styles.timeBlock}>
              <span style={styles.timeNum}>{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span style={styles.timeLabel}>Sec</span>
            </div>
          </div>
        </div>

        {/* 💎 STEP 4: GLASS FORM (transparent) */}
        <div style={styles.glassCard}>
          {!isPaid ? (
            <form onSubmit={handleSubmit}>
              <h2 style={styles.formTitle}>🎟️ Book Your Token</h2>

              <div style={styles.field}>
                <label style={styles.label}>Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Phone Number</label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  maxLength="10"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile number"
                  style={styles.input}
                />
              </div>

              <button type="submit" disabled={loading} style={styles.payBtn}>
                {loading ? '⏳ Processing...' : '💰 Pay ₹20 & Get Token'}
              </button>

              <p style={styles.note}>🔒 Secure payment via Razorpay</p>
            </form>
          ) : (
            <div style={styles.successBox}>
              <div style={styles.successIcon}>✅</div>
              <h2 style={styles.successTitle}>Payment Successful!</h2>

              <div style={styles.detailCard}>
                <div style={styles.detailRow}>
                  <span style={styles.detailKey}>Devotee</span>
                  <span style={styles.detailVal}>{confirmedToken.name}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailKey}>Token No</span>
                  <span style={styles.detailValHighlight}>{confirmedToken.tokenNo}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailKey}>Phone</span>
                  <span style={styles.detailVal}>{confirmedToken.phone}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailKey}>Amount Paid</span>
                  <span style={styles.detailVal}>₹20</span>
                </div>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.whatsappBtn}
              >
                📲 Send Token on WhatsApp
              </a>

              <p style={styles.blessing}>🙏 Blessings to you and your family 🙏</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer style={styles.footer}>
          <p style={styles.footerText}>
            🪔 Gaddiannaram Utsav Samithi • Dilsukhnagar, Hyderabad 🪔
          </p>
          <p style={styles.footerSub}>Ganesh Chaturthi 2026</p>
        </footer>

      </div>
    </div>
  );
}

/* ============================================================
   🎨 STYLES
   ============================================================ */
const styles = {
  /* ============================================================
     ROOT — FULL-PAGE BACKGROUND IMAGE (fixed, covers everything)
  ============================================================ */
  root: {
    position: 'relative',
    minHeight: '100vh',
    width: '100%',
    margin: 0,
    padding: 0,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    overflowX: 'hidden'
  },

  /* Dark overlay so text remains readable over the background image */
  bgOverlay: {
    position: 'fixed',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(74,14,14,0.75) 50%, rgba(0,0,0,0.85) 100%)',
    zIndex: 0,
    pointerEvents: 'none'
  },

  /* All content sits above the overlay */
  content: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },

  /* ============================================================
     🖼️ STEP 1: TOP IMAGE — FULL WIDTH + FULL HEIGHT
     (Shown clearly at top, nothing above it)
  ============================================================ */
  topImageWrap: {
    width: '100%',
    minHeight: '100vh',            /* ✅ FULL HEIGHT */
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'transparent',      /* ✅ transparent so bg image flows */
    padding: 0,
    margin: 0
  },
  topImage: {
    width: '100%',                  /* ✅ FULL WIDTH */
    height: '100vh',                /* ✅ FULL HEIGHT */
    maxHeight: '100vh',
    objectFit: 'contain',           /* keeps whole idol visible */
    display: 'block'
  },

  /* ============================================================
     🏷️ STEP 2: EVENT NAME — transparent background
  ============================================================ */
  headerSection: {
    width: '100%',
    maxWidth: '700px',
    textAlign: 'center',
    padding: '30px 20px 20px',
    background: 'transparent'       /* ✅ transparent */
  },
  eventName: {
    margin: 0,
    fontSize: 'clamp(22px, 6vw, 34px)',
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: '0.5px',
    textShadow: '0 3px 16px rgba(0,0,0,0.95), 0 0 24px rgba(212,160,23,0.5)'
  },
  eventLocation: {
    margin: '10px 0 0',
    fontSize: 'clamp(13px, 3.5vw, 16px)',
    color: '#ffe0b2',
    letterSpacing: '0.4px',
    textShadow: '0 2px 10px rgba(0,0,0,0.95)'
  },

  /* ============================================================
     ⏳ STEP 3: COUNTDOWN — transparent glass
  ============================================================ */
  countdownSection: {
    width: '100%',
    maxWidth: '520px',
    textAlign: 'center',
    padding: '14px 20px 24px',
    background: 'transparent'       /* ✅ transparent */
  },
  countdownLabel: {
    margin: '0 0 14px',
    fontSize: 'clamp(13px, 3.5vw, 15px)',
    fontWeight: 'bold',
    color: '#fff8e1',
    letterSpacing: '0.4px',
    textShadow: '0 2px 8px rgba(0,0,0,0.85)'
  },
  countdownGrid: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  },
  timeBlock: {
    background: 'rgba(183, 28, 28, 0.55)',   /* semi-transparent */
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1.5px solid rgba(255, 215, 0, 0.55)',
    borderRadius: '12px',
    padding: '10px 14px',
    minWidth: '68px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 6px 18px rgba(0,0,0,0.35)'
  },
  timeNum: {
    fontSize: 'clamp(20px, 5vw, 24px)',
    fontWeight: 'bold',
    color: '#FFD700',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums'
  },
  timeLabel: {
    fontSize: '10px',
    color: '#ffe0b2',
    textTransform: 'uppercase',
    letterSpacing: '1.2px',
    marginTop: '5px'
  },

  /* ============================================================
     💎 STEP 4: GLASS FORM — transparent card
  ============================================================ */
  glassCard: {
    width: '100%',
    maxWidth: '460px',
    margin: '10px 16px 40px',
    background: 'rgba(255, 248, 240, 0.15)',      /* ✅ transparent */
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1.5px solid rgba(255, 255, 255, 0.35)',
    borderRadius: '20px',
    padding: '26px 24px 28px',
    boxShadow:
      '0 25px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.3)'
  },

  formTitle: {
    margin: '0 0 20px',
    fontSize: '20px',
    color: '#fff8e1',
    textAlign: 'center',
    fontWeight: 'bold',
    textShadow: '0 2px 10px rgba(0,0,0,0.85)'
  },
  field: { marginBottom: '16px' },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff3e0',
    letterSpacing: '0.3px',
    textShadow: '0 1px 5px rgba(0,0,0,0.8)'
  },
  input: {
    width: '100%',
    padding: '13px 14px',
    fontSize: '15px',
    borderRadius: '10px',
    border: '1.5px solid rgba(255, 255, 255, 0.45)',
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#3e2723',
    outline: 'none',
    boxSizing: 'border-box'
  },
  payBtn: {
    width: '100%',
    padding: '15px',
    marginTop: '6px',
    background: 'linear-gradient(135deg, #e65100 0%, #b71c1c 100%)',
    color: '#fff8e1',
    border: '1.5px solid rgba(255, 215, 0, 0.55)',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    boxShadow: '0 8px 24px rgba(230, 81, 0, 0.6)'
  },
  note: {
    margin: '14px 0 0',
    fontSize: '11.5px',
    color: '#ffe0b2',
    textAlign: 'center',
    textShadow: '0 1px 5px rgba(0,0,0,0.8)'
  },

  /* Success */
  successBox: { textAlign: 'center' },
  successIcon: { fontSize: '44px', marginBottom: '4px' },
  successTitle: {
    margin: '0 0 18px',
    fontSize: '21px',
    color: '#a5d6a7',
    fontWeight: 'bold',
    textShadow: '0 2px 10px rgba(0,0,0,0.85)'
  },
  detailCard: {
    background: 'rgba(255, 248, 240, 0.95)',
    border: '2px solid #d4a017',
    borderRadius: '12px',
    padding: '14px 16px',
    marginBottom: '20px',
    textAlign: 'left'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '9px 0',
    borderBottom: '1px dashed #e0c9a6',
    fontSize: '14px'
  },
  detailKey: { color: '#5d4037', fontWeight: '600' },
  detailVal: {
    color: '#3e2723',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
    wordBreak: 'break-word'
  },
  detailValHighlight: {
    color: '#b71c1c',
    fontWeight: 'bold',
    fontSize: '15px',
    letterSpacing: '0.5px'
  },
  whatsappBtn: {
    display: 'block',
    width: '100%',
    padding: '15px',
    background: '#25D366',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    boxShadow: '0 8px 24px rgba(37, 211, 102, 0.6)',
    boxSizing: 'border-box'
  },
  blessing: {
    margin: '18px 0 0',
    fontSize: '13px',
    color: '#fff3e0',
    fontStyle: 'italic',
    textShadow: '0 1px 6px rgba(0,0,0,0.85)'
  },

  /* Footer */
  footer: {
    width: '100%',
    textAlign: 'center',
    padding: '20px 16px 40px',
    background: 'transparent'
  },
  footerText: {
    margin: 0,
    fontSize: '13px',
    letterSpacing: '0.4px',
    color: '#ffe0b2',
    textShadow: '0 1px 6px rgba(0,0,0,0.85)'
  },
  footerSub: {
    margin: '6px 0 0',
    fontSize: '11px',
    opacity: 0.75,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: '#ffe0b2'
  }
};