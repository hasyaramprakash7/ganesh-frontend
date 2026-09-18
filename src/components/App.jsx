import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ganeshImg from '../assets/ganesh.jpeg';

const API_BASE = 'https://ganesh-ikqb.onrender.com';

// ============================================================
// BUSINESS / EVENT CONSTANTS — edit these in one place
// ============================================================
const ORG = {
  name: 'Gaddiannaram Utsav Samithi',
  entityType: 'Registered Festival Committee (Mandap Committee)',
  address: 'Gaddiannaram, Dilsukhnagar, Hyderabad, Telangana 500060, India',
  email: 'bluxury1000@gmail.com',
  phone: '+91 7893828468',
  festival: 'Vinayak Ganesh Chaturthi 2026',
  venue:
    'Gaddiannaram Utsav Samithi Pandal, Gaddiannaram, Dilsukhnagar, Hyderabad, Telangana 500060',
  counterTimings: '8:00 AM – 9:00 PM (all festival days)',
};

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  // Current page: 'booking' | 'about' | 'terms' | 'refund' | 'privacy' | 'shipping' | 'contact'
  const [page, setPage] = useState('booking');

  // Booking form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [confirmedPass, setConfirmedPass] = useState(null);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const COLLECTION_DATE = new Date(new Date().getFullYear(), 8, 25, 13, 0, 0);

  // Warm up backend
  useEffect(() => {
    axios.get(`${API_BASE}/`).catch(() => {});
  }, []);

  // Countdown
  useEffect(() => {
    const tick = () => {
      const distance = COLLECTION_DATE.getTime() - new Date().getTime();
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

  // Load Razorpay SDK
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // Payment handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      alert('Failed to load Razorpay SDK. Check your internet and try again.');
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.post(`${API_BASE}/api/pass/create`, {
        name,
        phone,
      });

      if (!data.success) throw new Error(data.error || 'Order creation failed');

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: ORG.name,
        description: 'Laddu Prasad Pass Booking',
        order_id: data.order_id,
        prefill: { name, contact: phone },
        theme: { color: '#b71c1c' },
        handler: async function (response) {
          try {
            const verifyRes = await axios.post(`${API_BASE}/api/pass/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              passNo: data.passNo,
            });

            if (verifyRes.data.success) {
              setIsPaid(true);
              setWhatsappUrl(verifyRes.data.whatsappUrl);
              setConfirmedPass(verifyRes.data.passDetails);
            } else {
              alert(
                'Payment verification failed: ' +
                  (verifyRes.data.message || 'unknown')
              );
            }
          } catch (err) {
            console.error('Verification error:', err);
            alert(
              'Payment verification error. Please contact support with Payment ID: ' +
                response.razorpay_payment_id
            );
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            alert('Payment window closed. You can try again when ready.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('PAYMENT ERROR:', err);
      alert('Payment error: ' + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  // Navigate to a policy page and scroll to top
  const goTo = (p) => {
    setPage(p);
    window.scrollTo(0, 0);
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div
      style={{
        ...styles.root,
        backgroundImage: `url(${ganeshImg})`,
      }}
    >
      <div style={styles.bgOverlay} />

      <div style={styles.content}>
        {page === 'booking' ? (
          <BookingPage
            name={name}
            setName={setName}
            phone={phone}
            setPhone={setPhone}
            loading={loading}
            isPaid={isPaid}
            whatsappUrl={whatsappUrl}
            confirmedPass={confirmedPass}
            handleSubmit={handleSubmit}
            timeLeft={timeLeft}
            goTo={goTo}
          />
        ) : (
          <PolicyPage page={page} goTo={goTo} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// BOOKING PAGE
// ============================================================
function BookingPage({
  name,
  setName,
  phone,
  setPhone,
  loading,
  isPaid,
  whatsappUrl,
  confirmedPass,
  handleSubmit,
  timeLeft,
  goTo,
}) {
  return (
    <>
      <div style={styles.topImageWrap}>
        <img src={ganeshImg} alt="Ganesh Idol" style={styles.topImage} />
      </div>

      <div style={styles.headerSection}>
        <h1 style={styles.eventName}>🪔 {ORG.name} 🪔</h1>
        <p style={styles.eventLocation}>📍 Gaddiannaram, Dilsukhnagar, Hyderabad</p>
      </div>

      <div style={styles.countdownSection}>
        <p style={styles.countdownLabel}>
          🎯 Laddu Collection Starts: 25th at 1:00 PM
        </p>
        <div style={styles.countdownGrid}>
          <TimeBlock num={timeLeft.days} label="Days" />
          <TimeBlock num={String(timeLeft.hours).padStart(2, '0')} label="Hours" />
          <TimeBlock num={String(timeLeft.minutes).padStart(2, '0')} label="Min" />
          <TimeBlock num={String(timeLeft.seconds).padStart(2, '0')} label="Sec" />
        </div>
      </div>

      <div style={styles.glassCard}>
        {!isPaid ? (
          <form onSubmit={handleSubmit}>
            <h2 style={styles.formTitle}>🎟️ Book Your Laddu Prasad Pass</h2>

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
              {loading ? '⏳ Processing...' : '💰 Pay ₹20 & Get Pass'}
            </button>

            <p style={styles.note}>🔒 Secure payment via Razorpay</p>
          </form>
        ) : (
          <div style={styles.successBox}>
            <div style={styles.successIcon}>✅</div>
            <h2 style={styles.successTitle}>Booking Successful!</h2>

            <div style={styles.detailCard}>
              <DetailRow label="Devotee" value={confirmedPass.name} />
              <DetailRow
                label="Pass No"
                value={confirmedPass.passNo}
                highlight
              />
              <DetailRow label="Phone" value={confirmedPass.phone} />
              <DetailRow label="Amount Paid" value="₹20" />
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.whatsappBtn}
            >
              📲 Send Pass on WhatsApp
            </a>

            <p style={styles.blessing}>🙏 Blessings to you and your family 🙏</p>
          </div>
        )}
      </div>

      <Footer goTo={goTo} />
    </>
  );
}

// ============================================================
// SMALL REUSABLE COMPONENTS
// ============================================================
function TimeBlock({ num, label }) {
  return (
    <div style={styles.timeBlock}>
      <span style={styles.timeNum}>{num}</span>
      <span style={styles.timeLabel}>{label}</span>
    </div>
  );
}

function DetailRow({ label, value, highlight }) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailKey}>{label}</span>
      <span style={highlight ? styles.detailValHighlight : styles.detailVal}>
        {value}
      </span>
    </div>
  );
}

// ============================================================
// FOOTER with policy links
// ============================================================
function Footer({ goTo }) {
  const links = [
    { key: 'about', label: 'About Us' },
    { key: 'terms', label: 'Terms & Conditions' },
    { key: 'refund', label: 'Refund Policy' },
    { key: 'privacy', label: 'Privacy Policy' },
    { key: 'shipping', label: 'Delivery Policy' },
    { key: 'contact', label: 'Contact Us' },
  ];

  return (
    <footer style={styles.footer}>
      <p style={styles.footerText}>🪔 {ORG.name} • Dilsukhnagar, Hyderabad 🪔</p>
      <p style={styles.footerLinks}>
        {links.map((l, i) => (
          <React.Fragment key={l.key}>
            <span style={styles.footerLink} onClick={() => goTo(l.key)}>
              {l.label}
            </span>
            {i < links.length - 1 && ' • '}
          </React.Fragment>
        ))}
      </p>
      <p style={styles.footerSub}>Ganesh Chaturthi 2026</p>
    </footer>
  );
}

// ============================================================
// POLICY PAGE WRAPPER
// ============================================================
function PolicyPage({ page, goTo }) {
  const nav = [
    { key: 'about', label: 'About Us' },
    { key: 'terms', label: 'Terms & Conditions' },
    { key: 'refund', label: 'Refund Policy' },
    { key: 'privacy', label: 'Privacy Policy' },
    { key: 'shipping', label: 'Delivery Policy' },
    { key: 'contact', label: 'Contact Us' },
  ];

  return (
    <div style={styles.policyContainer}>
      <span style={styles.backLink} onClick={() => goTo('booking')}>
        ← Back to Booking
      </span>

      <nav style={styles.policyNav}>
        {nav.map((n, i) => (
          <React.Fragment key={n.key}>
            <span
              style={{
                ...styles.policyNavLink,
                ...(page === n.key ? styles.policyNavActive : {}),
              }}
              onClick={() => goTo(n.key)}
            >
              {n.label}
            </span>
            {i < nav.length - 1 && ' | '}
          </React.Fragment>
        ))}
      </nav>

      {page === 'about' && <AboutContent />}
      {page === 'terms' && <TermsContent />}
      {page === 'refund' && <RefundContent />}
      {page === 'privacy' && <PrivacyContent />}
      {page === 'shipping' && <ShippingContent />}
      {page === 'contact' && <ContactContent />}

      <p style={styles.policyFooter}>
        Ganesh Chaturthi 2026 · © {ORG.name} · {ORG.address}
      </p>
    </div>
  );
}

// ============================================================
// POLICY CONTENT SECTIONS
// ============================================================
function AboutContent() {
  return (
    <>
      <h1 style={styles.policyH1}>About Us &amp; Event Details</h1>
      <div style={styles.policyCard}>
        <p>
          <strong>Organisation Name:</strong> {ORG.name}
          <br />
          <strong>Entity Type:</strong> {ORG.entityType}
          <br />
          <strong>Address:</strong> {ORG.address}
          <br />
          <strong>Email:</strong> {ORG.email}
          <br />
          <strong>Phone:</strong> {ORG.phone}
        </p>
      </div>

      <h2 style={styles.policyH2}>Who We Are</h2>
      <p>
        {ORG.name} is a community festival committee that organises the annual
        Vinayak Ganesh Chaturthi celebrations at Gaddiannaram, Dilsukhnagar,
        Hyderabad. The committee manages the pandal, daily pooja schedule,
        prasadam distribution and cultural programmes for the duration of the
        festival.
      </p>

      <h2 style={styles.policyH2}>About the Laddu Prasad Pass</h2>
      <p>
        During the festival we prepare a limited quantity of <strong>Laddu Prasad</strong>{' '}
        for distribution at the pandal counter. To help us plan quantities
        accurately and avoid crowding, devotees can reserve their Laddu Prasad
        in advance by booking a <strong>Festival Laddu Booking Ticket (Laddu
        Prasad Pass)</strong> for <strong>₹20</strong> per pass.
      </p>
      <ul>
        <li>
          Each pass entitles the holder to collect <strong>one Laddu Prasad</strong>{' '}
          at the Vinayak Chaturthi Pandal / Event counter.
        </li>
        <li>
          The pass is issued digitally as a pass number and delivered on
          WhatsApp instantly after payment is confirmed.
        </li>
        <li>
          The pass is valid only for the current festival duration and is
          non-transferable.
        </li>
      </ul>

      <h2 style={styles.policyH2}>Event Details</h2>
      <div style={styles.policyCard}>
        <p>
          <strong>Festival:</strong> {ORG.festival}
          <br />
          <strong>Venue:</strong> {ORG.venue}
          <br />
          <strong>Prasadam Counter Timings:</strong> {ORG.counterTimings}
          <br />
          <strong>Pass Booking:</strong> Open online through this website
        </p>
      </div>

      <h2 style={styles.policyH2}>Our Service</h2>
      <p>
        This website is a booking and reservation service for the Laddu Prasad
        distribution conducted by the committee. It is not a financial product,
        investment product, gift card or loyalty programme of any kind. All
        payments are collected solely as a festival prasadam booking fee.
      </p>

      <h2 style={styles.policyH2}>Payments</h2>
      <p>
        All online payments on this website are processed securely through our
        payment gateway partner <strong>Razorpay</strong>. We do not store your
        card, UPI or bank account details on our servers.
      </p>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <h1 style={styles.policyH1}>Terms &amp; Conditions</h1>
      <p>
        By booking a Laddu Prasad on this website, you agree to the following
        terms:
      </p>
      <ul>
        <li>The pre-booking fee is ₹20 per Laddu Prasad.</li>
        <li>
          Each successful payment guarantees one Laddu Prasad to be collected
          at the Vinayak Chaturthi Pandal counter during the festival.
        </li>
        <li>
          The booking confirmation (Pass No) will be sent to your WhatsApp
          number after payment verification.
        </li>
        <li>
          The pass is non-transferable. Duplicate or tampered confirmations
          will be rejected.
        </li>
        <li>
          The Laddu Prasad must be collected in person during the festival. No
          shipping is provided.
        </li>
        <li>The organiser's decision regarding the distribution is final.</li>
        <li>
          Any misuse, fraudulent payment, or attempt to manipulate the system
          will result in cancellation without refund.
        </li>
      </ul>
    </>
  );
}

function RefundContent() {
  return (
    <>
      <h1 style={styles.policyH1}>Refund &amp; Cancellation Policy</h1>
      <ul>
        <li>
          The ₹20 pre-booking fee is <strong>non-refundable</strong> once
          payment is successful.
        </li>
        <li>
          If a payment is deducted but the booking is not generated due to a
          technical failure on our side, contact us within 24 hours with your
          Razorpay Payment ID and we will process a full refund.
        </li>
        <li>
          Refunds, when applicable, are processed within 5–7 business days to
          the original payment method.
        </li>
        <li>
          For refund requests, email {ORG.email} or call {ORG.phone}.
        </li>
      </ul>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <h1 style={styles.policyH1}>Privacy Policy</h1>
      <p>
        We collect only the information you provide:{' '}
        <strong>your name and mobile number</strong>.
      </p>
      <ul>
        <li>
          This information is used solely to generate your booking and send
          confirmation via WhatsApp.
        </li>
        <li>
          We do not sell, share, or rent your personal data to any third party.
        </li>
        <li>
          Payment information is processed securely by Razorpay. We do not
          store your card, UPI, or bank details.
        </li>
        <li>
          Data is stored securely and retained only for the duration of this
          event.
        </li>
        <li>
          To request deletion of your data, email us at {ORG.email}.
        </li>
      </ul>
    </>
  );
}

function ShippingContent() {
  return (
    <>
      <h1 style={styles.policyH1}>Delivery Policy</h1>
      <p>
        This is a <strong>pre-booking for a physical product (Laddu Prasad)</strong>.
      </p>
      <ul>
        <li>
          No shipping is provided. The Laddu Prasad must be collected in person
          at the {ORG.name} Pandal counter during the festival.
        </li>
        <li>
          Your pass number (Pass No) is delivered instantly via WhatsApp after
          successful payment verification.
        </li>
        <li>
          Show the WhatsApp confirmation at the pandal counter to collect your
          Laddu Prasad.
        </li>
        <li>
          If you do not receive the WhatsApp message within 30 minutes of
          payment, contact us at {ORG.email} or {ORG.phone}.
        </li>
      </ul>
    </>
  );
}

function ContactContent() {
  return (
    <>
      <h1 style={styles.policyH1}>Contact Us</h1>
      <div style={styles.policyCard}>
        <p>
          <strong>{ORG.name}</strong>
          <br />
          Gaddiannaram, Dilsukhnagar,
          <br />
          Hyderabad, Telangana 500060, India
          <br />
          📧 {ORG.email}
          <br />
          📞 {ORG.phone}
        </p>
      </div>
      <p>
        For any queries regarding your Laddu Prasad booking, refunds, or
        delivery, please contact us using the details above. We aim to respond
        within 24 hours.
      </p>
    </>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = {
  // -------- Root layout --------
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
    overflowX: 'hidden',
  },
  bgOverlay: {
    position: 'fixed',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(74,14,14,0.75) 50%, rgba(0,0,0,0.85) 100%)',
    zIndex: 0,
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  // -------- Top image --------
  topImageWrap: {
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'transparent',
    padding: 0,
    margin: 0,
  },
  topImage: {
    width: '100%',
    height: '100vh',
    maxHeight: '100vh',
    objectFit: 'contain',
    display: 'block',
  },

  // -------- Header --------
  headerSection: {
    width: '100%',
    maxWidth: '700px',
    textAlign: 'center',
    padding: '30px 20px 20px',
  },
  eventName: {
    margin: 0,
    fontSize: 'clamp(22px, 6vw, 34px)',
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: '0.5px',
    textShadow: '0 3px 16px rgba(0,0,0,0.95), 0 0 24px rgba(212,160,23,0.5)',
  },
  eventLocation: {
    margin: '10px 0 0',
    fontSize: 'clamp(13px, 3.5vw, 16px)',
    color: '#ffe0b2',
    letterSpacing: '0.4px',
    textShadow: '0 2px 10px rgba(0,0,0,0.95)',
  },

  // -------- Countdown --------
  countdownSection: {
    width: '100%',
    maxWidth: '520px',
    textAlign: 'center',
    padding: '14px 20px 24px',
  },
  countdownLabel: {
    margin: '0 0 14px',
    fontSize: 'clamp(13px, 3.5vw, 15px)',
    fontWeight: 'bold',
    color: '#fff8e1',
    letterSpacing: '0.4px',
    textShadow: '0 2px 8px rgba(0,0,0,0.85)',
  },
  countdownGrid: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  timeBlock: {
    background: 'rgba(183, 28, 28, 0.55)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1.5px solid rgba(255, 215, 0, 0.55)',
    borderRadius: '12px',
    padding: '10px 14px',
    minWidth: '68px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
  },
  timeNum: {
    fontSize: 'clamp(20px, 5vw, 24px)',
    fontWeight: 'bold',
    color: '#FFD700',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  timeLabel: {
    fontSize: '10px',
    color: '#ffe0b2',
    textTransform: 'uppercase',
    letterSpacing: '1.2px',
    marginTop: '5px',
  },

  // -------- Glass form card --------
  glassCard: {
    width: '100%',
    maxWidth: '460px',
    margin: '10px 16px 40px',
    background: 'rgba(255, 248, 240, 0.15)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1.5px solid rgba(255, 255, 255, 0.35)',
    borderRadius: '20px',
    padding: '26px 24px 28px',
    boxShadow:
      '0 25px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.3)',
    boxSizing: 'border-box',
  },
  formTitle: {
    margin: '0 0 20px',
    fontSize: '20px',
    color: '#fff8e1',
    textAlign: 'center',
    fontWeight: 'bold',
    textShadow: '0 2px 10px rgba(0,0,0,0.85)',
  },
  field: { marginBottom: '16px' },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff3e0',
    letterSpacing: '0.3px',
    textShadow: '0 1px 5px rgba(0,0,0,0.8)',
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
    boxSizing: 'border-box',
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
    boxShadow: '0 8px 24px rgba(230, 81, 0, 0.6)',
  },
  note: {
    margin: '14px 0 0',
    fontSize: '11.5px',
    color: '#ffe0b2',
    textAlign: 'center',
    textShadow: '0 1px 5px rgba(0,0,0,0.8)',
  },

  // -------- Success --------
  successBox: { textAlign: 'center' },
  successIcon: { fontSize: '44px', marginBottom: '4px' },
  successTitle: {
    margin: '0 0 18px',
    fontSize: '21px',
    color: '#a5d6a7',
    fontWeight: 'bold',
    textShadow: '0 2px 10px rgba(0,0,0,0.85)',
  },
  detailCard: {
    background: 'rgba(255, 248, 240, 0.95)',
    border: '2px solid #d4a017',
    borderRadius: '12px',
    padding: '14px 16px',
    marginBottom: '20px',
    textAlign: 'left',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '9px 0',
    borderBottom: '1px dashed #e0c9a6',
    fontSize: '14px',
  },
  detailKey: { color: '#5d4037', fontWeight: '600' },
  detailVal: {
    color: '#3e2723',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
    wordBreak: 'break-word',
  },
  detailValHighlight: {
    color: '#b71c1c',
    fontWeight: 'bold',
    fontSize: '15px',
    letterSpacing: '0.5px',
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
    boxSizing: 'border-box',
  },
  blessing: {
    margin: '18px 0 0',
    fontSize: '13px',
    color: '#fff3e0',
    fontStyle: 'italic',
    textShadow: '0 1px 6px rgba(0,0,0,0.85)',
  },

  // -------- Footer --------
  footer: {
    width: '100%',
    textAlign: 'center',
    padding: '20px 16px 40px',
  },
  footerText: {
    margin: 0,
    fontSize: '13px',
    letterSpacing: '0.4px',
    color: '#ffe0b2',
    textShadow: '0 1px 6px rgba(0,0,0,0.85)',
  },
  footerLinks: {
    margin: '10px 0 0',
    fontSize: '12px',
    color: '#ffe0b2',
    letterSpacing: '0.3px',
  },
  footerLink: {
    color: '#FFD700',
    textDecoration: 'underline',
    cursor: 'pointer',
    textShadow: '0 1px 5px rgba(0,0,0,0.85)',
  },
  footerSub: {
    margin: '6px 0 0',
    fontSize: '11px',
    opacity: 0.75,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: '#ffe0b2',
  },

  // -------- Policy pages --------
  policyContainer: {
    width: '100%',
    maxWidth: '800px',
    margin: '40px auto 80px',
    padding: '26px 24px 34px',
    background: '#fffaf3',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
    color: '#2b2b2b',
    lineHeight: 1.6,
    boxSizing: 'border-box',
  },
  backLink: {
    display: 'inline-block',
    marginBottom: '18px',
    color: '#b71c1c',
    cursor: 'pointer',
    fontWeight: '600',
    textDecoration: 'none',
  },
  policyNav: {
    marginBottom: '22px',
    paddingBottom: '14px',
    borderBottom: '2px solid #ffe0b2',
    fontSize: '14px',
  },
  policyNavLink: {
    color: '#b71c1c',
    cursor: 'pointer',
    margin: '0 2px',
    textDecoration: 'none',
  },
  policyNavActive: {
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
  policyH1: {
    color: '#b71c1c',
    marginTop: 0,
    fontSize: '26px',
  },
  policyH2: {
    color: '#e65100',
    marginTop: '30px',
    borderBottom: '2px solid #ffe0b2',
    paddingBottom: '6px',
    fontSize: '20px',
  },
  policyCard: {
    background: '#fff',
    border: '1px solid #ffe0b2',
    borderRadius: '8px',
    padding: '14px 18px',
    margin: '16px 0',
  },
  policyFooter: {
    marginTop: '40px',
    fontSize: '13px',
    color: '#666',
  },
};