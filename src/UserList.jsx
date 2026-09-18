import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ganeshImg from '../src/assets/ganesh.jpeg'; // same image as App.js

const API_BASE = 'https://ganesh-ikqb.onrender.com';

const ORG = {
  name: 'Gaddiannaram Utsav Samithi',
  festival: 'Vinayak Ganesh Chaturthi 2026',
  phone: '+91 7893828468',
  email: 'bluxury1000@gmail.com',
};

export default function UserList() {
  const [passes, setPasses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [passRes, statRes] = await Promise.all([
        axios.get(`${API_BASE}/api/admin/passes`),
        axios.get(`${API_BASE}/api/admin/stats`),
      ]);
      if (passRes.data.success) setPasses(passRes.data.passes || []);
      if (statRes.data.success) setStats(statRes.data.stats);
    } catch (err) {
      console.error('UserList fetch error:', err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          'Failed to load data from server'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = passes
    .filter((p) => (filter === 'ALL' ? true : p.status === filter))
    .filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.passNo?.toLowerCase().includes(q) ||
        p.paymentId?.toLowerCase().includes(q)
      );
    });

  const totalAmount = stats?.totalAmount ?? 0;

  const goHome = () => {
    window.location.href = '/';
  };

  const downloadCSV = () => {
    const header = 'PassNo,Name,Phone,Status,PaymentId,OrderId,CreatedAt\n';
    const rows = filtered
      .map(
        (p) =>
          `${p.passNo},"${p.name}",${p.phone},${p.status},${
            p.paymentId || ''
          },${p.orderId},${new Date(p.createdAt).toISOString()}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laddu-passes-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={s.root}>
      <div style={s.bgWrapper}>
        <img src={ganeshImg} alt="Ganesha" style={s.bgImage} />
        <div style={s.bgOverlay} />
      </div>

      <div style={s.content}>
        <div style={s.header}>
          <h1 style={s.title}>🪔 Booking List 🪔</h1>
          <p style={s.subtitle}>
            {ORG.name} · {ORG.festival}
          </p>
        </div>

        <div style={s.topBar}>
          <button onClick={fetchData} style={s.refreshBtn}>
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
          <button onClick={downloadCSV} style={s.csvBtn}>
            ⬇️ Download CSV
          </button>
          <button onClick={goHome} style={s.homeBtn}>
            ← Back to Booking
          </button>
        </div>

        {error && <div style={s.errorBox}>⚠️ {error}</div>}

        {stats && (
          <div style={s.statsGrid}>
            <StatCard label="Total" value={stats.total} color="#FFD700" />
            <StatCard label="Success" value={stats.success} color="#4ade80" />
            <StatCard label="Pending" value={stats.pending} color="#fbbf24" />
            <StatCard label="Failed" value={stats.failed} color="#f87171" />
            <StatCard
              label="Collected"
              value={`₹${totalAmount}`}
              color="#60a5fa"
            />
          </div>
        )}

        <div style={s.filterBar}>
          <div style={s.filterBtns}>
            {['ALL', 'SUCCESS', 'PENDING', 'FAILED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={filter === f ? s.filterActive : s.filterBtn}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search name / phone / pass / payment"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={s.searchInput}
          />
        </div>

        <div style={s.tableCard}>
          {loading && passes.length === 0 ? (
            <p style={s.empty}>Loading bookings…</p>
          ) : filtered.length === 0 ? (
            <p style={s.empty}>No bookings found</p>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>#</th>
                    <th style={s.th}>Pass No</th>
                    <th style={s.th}>Name</th>
                    <th style={s.th}>Phone</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Payment ID</th>
                    <th style={s.th}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p._id} style={s.tr}>
                      <td style={s.td}>{i + 1}</td>
                      <td style={{ ...s.td, ...s.mono }}>{p.passNo}</td>
                      <td style={s.td}>{p.name}</td>
                      <td style={s.td}>{p.phone}</td>
                      <td
                        style={{
                          ...s.td,
                          fontWeight: 'bold',
                          color:
                            p.status === 'SUCCESS'
                              ? '#4ade80'
                              : p.status === 'PENDING'
                              ? '#fbbf24'
                              : '#f87171',
                        }}
                      >
                        {p.status}
                      </td>
                      <td style={{ ...s.td, ...s.mono }}>
                        {p.paymentId || '—'}
                      </td>
                      <td style={s.td}>
                        {new Date(p.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p style={s.footerNote}>
          Showing {filtered.length} of {passes.length} bookings · 📞{' '}
          {ORG.phone} · ✉️ {ORG.email}
        </p>

        <div style={s.bottomSpace} />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={s.statCard}>
      <span style={s.statLabel}>{label}</span>
      <span style={{ ...s.statValue, color }}>{value}</span>
    </div>
  );
}

const s = {
  root: {
    position: 'relative',
    minHeight: '100vh',
    width: '100%',
    margin: 0,
    padding: 0,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    backgroundColor: '#000',
    overflowX: 'hidden',
  },
  bgWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    zIndex: 0,
  },
  bgImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  bgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(74,14,14,0.9) 40%, rgba(0,0,0,0.97) 100%)',
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 16px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  header: { textAlign: 'center', marginBottom: '24px' },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: '0.5px',
    textShadow: '0 4px 20px rgba(0,0,0,0.95), 0 0 30px rgba(212,160,23,0.6)',
  },
  subtitle: {
    margin: '8px 0 0',
    fontSize: '13px',
    color: '#ffe0b2',
    letterSpacing: '0.4px',
    textShadow: '0 2px 10px rgba(0,0,0,0.95)',
  },
  topBar: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '18px',
  },
  refreshBtn: {
    padding: '10px 20px',
    borderRadius: '10px',
    border: '1.5px solid rgba(255,215,0,0.55)',
    background: 'linear-gradient(135deg, #e65100 0%, #b71c1c 100%)',
    color: '#fff8e1',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 6px 18px rgba(230,81,0,0.5)',
  },
  csvBtn: {
    padding: '10px 20px',
    borderRadius: '10px',
    border: '1.5px solid rgba(255,215,0,0.55)',
    background: 'rgba(183, 28, 28, 0.75)',
    color: '#FFD700',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
  },
  homeBtn: {
    padding: '10px 20px',
    borderRadius: '10px',
    border: '1.5px solid rgba(255,215,0,0.55)',
    background: 'transparent',
    color: '#FFD700',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
  },
  errorBox: {
    background: 'rgba(127, 29, 29, 0.85)',
    color: '#fecaca',
    border: '1px solid #dc2626',
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '16px',
    textAlign: 'center',
    fontSize: '14px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '10px',
    marginBottom: '18px',
  },
  statCard: {
    background: 'rgba(139, 0, 0, 0.7)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1.5px solid rgba(255,215,0,0.4)',
    borderRadius: '12px',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
  },
  statLabel: {
    fontSize: '11px',
    color: '#ffe0b2',
    textTransform: 'uppercase',
    letterSpacing: '1.2px',
    marginBottom: '4px',
  },
  statValue: { fontSize: '22px', fontWeight: 'bold' },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '14px',
  },
  filterBtns: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  filterBtn: {
    padding: '7px 16px',
    borderRadius: '20px',
    border: '1.5px solid rgba(255,215,0,0.4)',
    background: 'rgba(0,0,0,0.5)',
    color: '#ffe0b2',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  filterActive: {
    padding: '7px 16px',
    borderRadius: '20px',
    border: '1.5px solid #FFD700',
    background: 'linear-gradient(135deg, #e65100 0%, #b71c1c 100%)',
    color: '#fff8e1',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    boxShadow: '0 4px 14px rgba(230,81,0,0.5)',
  },
  searchInput: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid rgba(255,215,0,0.4)',
    background: 'rgba(0,0,0,0.6)',
    color: '#fff8e1',
    fontSize: '14px',
    minWidth: '260px',
    outline: 'none',
  },
  tableCard: {
    background: 'rgba(139, 0, 0, 0.6)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: '1.5px solid rgba(255,215,0,0.45)',
    borderRadius: '16px',
    padding: '8px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  },
  tableWrap: { overflowX: 'auto', borderRadius: '12px' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    minWidth: '900px',
  },
  th: {
    textAlign: 'left',
    padding: '12px 14px',
    background: 'rgba(0,0,0,0.55)',
    color: '#FFD700',
    textTransform: 'uppercase',
    fontSize: '11px',
    letterSpacing: '1px',
    borderBottom: '1.5px solid rgba(255,215,0,0.35)',
    position: 'sticky',
    top: 0,
  },
  tr: { borderBottom: '1px solid rgba(255,215,0,0.15)' },
  td: {
    padding: '11px 14px',
    color: '#fff8e1',
    verticalAlign: 'middle',
  },
  mono: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '12px',
    color: '#ffe0b2',
  },
  empty: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#ffe0b2',
    margin: 0,
    fontSize: '14px',
  },
  footerNote: {
    marginTop: '16px',
    fontSize: '12px',
    color: '#ffe0b2',
    textAlign: 'center',
    textShadow: '0 1px 6px rgba(0,0,0,0.85)',
  },
  bottomSpace: { height: '80px' },
};