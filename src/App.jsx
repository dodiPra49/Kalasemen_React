import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Trophy, 
  Flame, 
  RefreshCw, 
  Search, 
  AlertCircle, 
  Clock, 
  Sparkles,
  Award,
  UserPlus
} from 'lucide-react';
import AthleteEntry from './components/AthleteEntry';

const API_URL = 'http://localhost:8090/api/v1/medals';

export default function App() {
  const [currentTab, setCurrentTab] = useState('standings'); // 'standings' | 'athletes'
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    total_gold: 0,
    total_silver: 0,
    total_bronze: 0,
    grand_total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rank'); // 'rank', 'gold', 'total', 'name'
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch Medals Data
  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();

      if (result.success) {
        setData(result.data || []);
        if (result.summary) {
          setSummary(result.summary);
        } else {
          // Fallback calculate summary if missing
          const calcSummary = (result.data || []).reduce(
            (acc, curr) => {
              acc.total_gold += Number(curr.gold || 0);
              acc.total_silver += Number(curr.silver || 0);
              acc.total_bronze += Number(curr.bronze || 0);
              acc.grand_total += Number(curr.total_medals || 0);
              return acc;
            },
            { total_gold: 0, total_silver: 0, total_bronze: 0, grand_total: 0 }
          );
          setSummary(calcSummary);
        }
        setLastUpdated(new Date());
      } else {
        throw new Error(result.message || 'Gagal memuat data klasemen medali.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Gagal terhubung ke API server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh interval (every 15 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Filter and Sort Data
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          item.contingent_name?.toLowerCase().includes(q) ||
          item.contingent_code?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'gold') {
        return (b.gold || 0) - (a.gold || 0) || (b.silver || 0) - (a.silver || 0);
      }
      if (sortBy === 'total') {
        return (b.total_medals || 0) - (a.total_medals || 0);
      }
      if (sortBy === 'name') {
        return (a.contingent_name || '').localeCompare(b.contingent_name || '');
      }
      // default: rank
      return (a.rank || a.rank_position || 0) - (b.rank || b.rank_position || 0);
    });

    return result;
  }, [data, searchQuery, sortBy]);

  // Top 3 Podium Contingents
  const topThree = useMemo(() => {
    const sortedByRank = [...data].sort(
      (a, b) => (a.rank || a.rank_position || 0) - (b.rank || b.rank_position || 0)
    );
    return {
      first: sortedByRank[0] || null,
      second: sortedByRank[1] || null,
      third: sortedByRank[2] || null,
    };
  }, [data]);

  // Format time in WIB
  const formatTime = date => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  };

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon-box" title="Porprov Sumbar 2026">
            <Flame size={30} color="#FFFFFF" />
          </div>
          <div className="brand-text">
            <h1>
              PORPROV SUMBAR 2026
              <span className="brand-badge">
                <span className="pulse-dot"></span>
                LIVE STANDING
              </span>
            </h1>
            <p className="brand-subtitle">
              Klasemen Sementara Perolehan Medali Pekan Olahraga Provinsi Sumatera Barat
            </p>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <nav className="nav-pill-group" aria-label="Navigasi Utama">
          <button
            className={`nav-pill-btn ${currentTab === 'standings' ? 'nav-pill-active' : ''}`}
            onClick={() => setCurrentTab('standings')}
          >
            <Trophy size={16} />
            <span>Klasemen Medali</span>
          </button>

          <button
            className={`nav-pill-btn ${currentTab === 'athletes' ? 'nav-pill-active' : ''}`}
            onClick={() => setCurrentTab('athletes')}
          >
            <UserPlus size={16} />
            <span>Entri Data Atlet</span>
            <span className="nav-badge-new">8002</span>
          </button>
        </nav>

        <div className="header-actions">
          {currentTab === 'standings' ? (
            <>
              <button
                className="btn-quick-entry"
                onClick={() => setCurrentTab('athletes')}
                title="Buka form pendaftaran atlet baru"
              >
                <UserPlus size={16} />
                <span>+ Entri Atlet</span>
              </button>

              <label className="auto-refresh-toggle" title="Perbarui data otomatis tiap 15 detik">
                <input 
                  type="checkbox" 
                  checked={autoRefresh} 
                  onChange={e => setAutoRefresh(e.target.checked)} 
                />
                <span>Auto Refresh (15s)</span>
              </label>

              <button
                className="btn-refresh"
                onClick={() => fetchData(true)}
                disabled={isRefreshing || isLoading}
                title="Klik untuk menyinkronkan data medali"
              >
                <RefreshCw size={16} className={isRefreshing ? 'spin-icon' : ''} />
                <span>{isRefreshing ? 'Menyinkronkan...' : 'Segarkan Data'}</span>
              </button>
            </>
          ) : (
            <button
              className="btn-refresh"
              onClick={() => setCurrentTab('standings')}
              title="Lihat Klasemen Medali"
            >
              <Trophy size={16} />
              <span>Lihat Klasemen</span>
            </button>
          )}
        </div>
      </header>

      {/* Conditional View: Athlete Entry vs Medals Standings */}
      {currentTab === 'athletes' ? (
        <AthleteEntry onBackToStandings={() => setCurrentTab('standings')} />
      ) : (
        <>
          {/* Status Bar */}
          <div className="status-bar">
            <div className="status-endpoint">
              <Clock size={14} />
              <span>Terakhir diperbarui: <strong>{formatTime(lastUpdated)}</strong></span>
            </div>
            <div className="status-endpoint">
              <span>Sumber API: <code>{API_URL}</code></span>
            </div>
          </div>

      {/* Error Alert */}
      {error && (
        <div className="error-card">
          <div className="error-content">
            <AlertCircle size={22} color="#EF4444" />
            <div>
              <strong>Koneksi API Gagal</strong>
              <p style={{ fontSize: '0.84rem', marginTop: '2px' }}>{error}</p>
            </div>
          </div>
          <button className="btn-retry" onClick={() => fetchData(true)}>
            Coba Lagi
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="summary-grid">
        <div className="summary-card card-gold">
          <div className="card-icon-wrapper icon-gold">
            🥇
          </div>
          <div className="card-data">
            <div className="card-label">Total Emas</div>
            <div className="card-value">
              {isLoading ? '...' : summary.total_gold.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        <div className="summary-card card-silver">
          <div className="card-icon-wrapper icon-silver">
            🥈
          </div>
          <div className="card-data">
            <div className="card-label">Total Perak</div>
            <div className="card-value">
              {isLoading ? '...' : summary.total_silver.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        <div className="summary-card card-bronze">
          <div className="card-icon-wrapper icon-bronze">
            🥉
          </div>
          <div className="card-data">
            <div className="card-label">Total Perunggu</div>
            <div className="card-value">
              {isLoading ? '...' : summary.total_bronze.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        <div className="summary-card card-total">
          <div className="card-icon-wrapper icon-total">
            <Trophy size={26} />
          </div>
          <div className="card-data">
            <div className="card-label">Total Medali</div>
            <div className="card-value">
              {isLoading ? '...' : summary.grand_total.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Showcase */}
      {!isLoading && !searchQuery && topThree.first && (
        <section className="podium-section">
          <div className="section-title">
            <Award size={20} color="#F59E0B" />
            <span>Podium Kehormatan 3 Besar</span>
          </div>

          <div className="podium-grid">
            {/* Rank 2 - Silver */}
            {topThree.second && (
              <div className="podium-card podium-rank-2">
                <div className="podium-badge-rank badge-rank-2">
                  <span>🥈 Peringkat 2</span>
                </div>
                <div 
                  className="podium-avatar"
                  style={{ backgroundColor: topThree.second.color_hex || '#4B5563' }}
                >
                  {topThree.second.contingent_code || '2'}
                </div>
                <div className="podium-name" title={topThree.second.contingent_name}>
                  {topThree.second.contingent_name}
                </div>
                <div className="podium-code">KONTINGEN {topThree.second.contingent_code}</div>

                <div className="podium-medals-mini">
                  <div className="podium-mini-item">
                    <span>🥇 Emas</span>
                    <span className="podium-mini-val gold-cell">{topThree.second.gold}</span>
                  </div>
                  <div className="podium-mini-item">
                    <span>🥈 Perak</span>
                    <span className="podium-mini-val silver-cell">{topThree.second.silver}</span>
                  </div>
                  <div className="podium-mini-item">
                    <span>🥉 Perunggu</span>
                    <span className="podium-mini-val bronze-cell">{topThree.second.bronze}</span>
                  </div>
                </div>

                <div className="podium-total-pill">
                  Total Medali: <strong>{topThree.second.total_medals}</strong>
                </div>
              </div>
            )}

            {/* Rank 1 - Gold */}
            {topThree.first && (
              <div className="podium-card podium-rank-1">
                <div className="podium-badge-rank badge-rank-1">
                  <Sparkles size={14} />
                  <span>👑 Juara 1 Sementara</span>
                </div>
                <div 
                  className="podium-avatar"
                  style={{ 
                    backgroundColor: topThree.first.color_hex || '#DC2626',
                    width: '64px',
                    height: '64px',
                    fontSize: '1.4rem'
                  }}
                >
                  {topThree.first.contingent_code || '1'}
                </div>
                <div className="podium-name" style={{ fontSize: '1.2rem' }} title={topThree.first.contingent_name}>
                  {topThree.first.contingent_name}
                </div>
                <div className="podium-code">KONTINGEN {topThree.first.contingent_code}</div>

                <div className="podium-medals-mini">
                  <div className="podium-mini-item">
                    <span>🥇 Emas</span>
                    <span className="podium-mini-val gold-cell">{topThree.first.gold}</span>
                  </div>
                  <div className="podium-mini-item">
                    <span>🥈 Perak</span>
                    <span className="podium-mini-val silver-cell">{topThree.first.silver}</span>
                  </div>
                  <div className="podium-mini-item">
                    <span>🥉 Perunggu</span>
                    <span className="podium-mini-val bronze-cell">{topThree.first.bronze}</span>
                  </div>
                </div>

                <div className="podium-total-pill">
                  Total Medali: <strong>{topThree.first.total_medals}</strong>
                </div>
              </div>
            )}

            {/* Rank 3 - Bronze */}
            {topThree.third && (
              <div className="podium-card podium-rank-3">
                <div className="podium-badge-rank badge-rank-3">
                  <span>🥉 Peringkat 3</span>
                </div>
                <div 
                  className="podium-avatar"
                  style={{ backgroundColor: topThree.third.color_hex || '#D97706' }}
                >
                  {topThree.third.contingent_code || '3'}
                </div>
                <div className="podium-name" title={topThree.third.contingent_name}>
                  {topThree.third.contingent_name}
                </div>
                <div className="podium-code">KONTINGEN {topThree.third.contingent_code}</div>

                <div className="podium-medals-mini">
                  <div className="podium-mini-item">
                    <span>🥇 Emas</span>
                    <span className="podium-mini-val gold-cell">{topThree.third.gold}</span>
                  </div>
                  <div className="podium-mini-item">
                    <span>🥈 Perak</span>
                    <span className="podium-mini-val silver-cell">{topThree.third.silver}</span>
                  </div>
                  <div className="podium-mini-item">
                    <span>🥉 Perunggu</span>
                    <span className="podium-mini-val bronze-cell">{topThree.third.bronze}</span>
                  </div>
                </div>

                <div className="podium-total-pill">
                  Total Medali: <strong>{topThree.third.total_medals}</strong>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Standings Table Card */}
      <div className="table-container-card">
        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Cari Kota / Kabupaten / Kode..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-actions">
            <select 
              className="sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="rank">Urutkan: Peringkat Resmi</option>
              <option value="gold">Urutkan: Emas Terbanyak</option>
              <option value="total">Urutkan: Total Medali</option>
              <option value="name">Urutkan: Nama Kontingen (A-Z)</option>
            </select>

            <span className="counter-text">
              {filteredAndSortedData.length} Kontingen
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="medals-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }} className="text-center">Pos</th>
                <th>Kontingen Daerah</th>
                <th className="text-center" style={{ width: '100px' }}>🥇 Emas</th>
                <th className="text-center" style={{ width: '100px' }}>🥈 Perak</th>
                <th className="text-center" style={{ width: '100px' }}>🥉 Perunggu</th>
                <th className="text-center" style={{ width: '110px' }}>Total</th>
                <th style={{ width: '160px' }}>Target Emas</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Skeleton loading rows
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="skeleton-row">
                    <td className="text-center">
                      <div className="skeleton-box" style={{ width: '30px', margin: '0 auto' }}></div>
                    </td>
                    <td>
                      <div className="skeleton-box" style={{ width: '180px' }}></div>
                    </td>
                    <td><div className="skeleton-box"></div></td>
                    <td><div className="skeleton-box"></div></td>
                    <td><div className="skeleton-box"></div></td>
                    <td><div className="skeleton-box"></div></td>
                    <td><div className="skeleton-box"></div></td>
                  </tr>
                ))
              ) : filteredAndSortedData.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <div className="empty-icon">🔍</div>
                      <h4>Kontingen Tidak Ditemukan</h4>
                      <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                        Tidak ada kontingen yang cocok dengan kata kunci "{searchQuery}".
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedData.map(item => {
                  const rank = item.rank || item.rank_position;
                  const rankBadgeClass =
                    rank === 1
                      ? 'rank-badge rank-1'
                      : rank === 2
                      ? 'rank-badge rank-2'
                      : rank === 3
                      ? 'rank-badge rank-3'
                      : 'rank-badge rank-other';

                  const targetGold = item.target_gold || 0;
                  const currentGold = item.gold || 0;
                  const progressPct = targetGold > 0 
                    ? Math.min(100, Math.round((currentGold / targetGold) * 100)) 
                    : 0;

                  return (
                    <tr key={item.id || item.contingent_id}>
                      {/* Rank Position */}
                      <td className="text-center">
                        <span className={rankBadgeClass}>
                          {rank}
                        </span>
                      </td>

                      {/* Contingent Name & Avatar */}
                      <td>
                        <div className="contingent-cell">
                          <div 
                            className="contingent-avatar"
                            style={{ backgroundColor: item.color_hex || '#3B82F6' }}
                          >
                            {item.contingent_code || item.contingent_name.substring(0, 3).toUpperCase()}
                          </div>
                          <div className="contingent-info">
                            <span className="contingent-title">
                              {item.contingent_name}
                            </span>
                            <span className="contingent-sub">
                              <span className="contingent-code-badge">
                                {item.contingent_code}
                              </span>
                              <span>Target: {item.target_gold || '-'} Emas</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Medals */}
                      <td className="text-center medal-count gold-cell">
                        {item.gold}
                      </td>
                      <td className="text-center medal-count silver-cell">
                        {item.silver}
                      </td>
                      <td className="text-center medal-count bronze-cell">
                        {item.bronze}
                      </td>

                      {/* Total */}
                      <td className="text-center">
                        <span className="total-badge">
                          {item.total_medals}
                        </span>
                      </td>

                      {/* Target Progress */}
                      <td>
                        <div className="target-progress-wrapper">
                          <div className="target-labels">
                            <span>{currentGold}/{targetGold || '-'}</span>
                            <span>{progressPct}%</span>
                          </div>
                          <div className="progress-track">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${progressPct}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

      {/* Footer */}
      <footer className="app-footer">
        <div>
          © 2026 Panitia Besar PORPROV SUMBAR 2026. Hak Cipta Dilindungi.
        </div>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            API Medali:{' '}
            <a 
              href={API_URL} 
              target="_blank" 
              rel="noreferrer" 
              className="footer-link"
            >
              {API_URL}
            </a>
          </div>
          <span style={{ opacity: 0.3 }}>•</span>
          <div>
            Endpoint Atlet:{' '}
            <a 
              href="http://127.0.0.1:8002/admin/athletes" 
              target="_blank" 
              rel="noreferrer" 
              className="footer-link"
            >
              http://127.0.0.1:8002/admin/athletes
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
