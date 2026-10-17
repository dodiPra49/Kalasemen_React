import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  UserPlus,
  Users,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Search,
  ShieldCheck,
  MapPin,
  Activity,
  Award,
  Sparkles,
  ExternalLink,
  ArrowLeft,
  Check,
  X
} from 'lucide-react';
import {
  ADMIN_ATHLETES_URL,
  getCreatePageMetadata,
  fetchAthletes,
  submitAthleteData,
  DEFAULT_CONTINGENTS,
  DEFAULT_SPORTS
} from '../services/athleteApi';

export default function AthleteEntry({ onBackToStandings }) {
  // Navigation tab inside athlete module
  const [activeSubTab, setActiveSubTab] = useState('form'); // 'form' | 'list'

  // Metadata / options from backend
  const [contingents, setContingents] = useState(DEFAULT_CONTINGENTS);
  const [sports, setSports] = useState(DEFAULT_SPORTS);
  const [csrfToken, setCsrfToken] = useState(null);
  const [endpointStatus, setEndpointStatus] = useState('checking'); // 'connected' | 'checking' | 'error'

  // Athletes list
  const [athletesList, setAthletesList] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedContingentFilter, setSelectedContingentFilter] = useState('');
  const [selectedSportFilter, setSelectedSportFilter] = useState('');

  // Form State
  const initialFormState = {
    full_name: '',
    nik: '',
    contingent_id: '1',
    sport_id: '1',
    gender: 'L',
    birth_place: '',
    birth_date: '',
    height_cm: 170,
    weight_kg: 60,
    achievements: '',
    photo_url: '/images/athletes/default.jpg',
    is_verified: true,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Load backend metadata & CSRF
  const loadMetadata = useCallback(async () => {
    setEndpointStatus('checking');
    try {
      const meta = await getCreatePageMetadata();
      if (meta.csrfToken) {
        setCsrfToken(meta.csrfToken);
        setEndpointStatus('connected');
      } else {
        setEndpointStatus('connected');
      }
      if (meta.contingents && meta.contingents.length > 0) {
        setContingents(meta.contingents);
      }
      if (meta.sports && meta.sports.length > 0) {
        setSports(meta.sports);
      }
    } catch {
      setEndpointStatus('error');
    }
  }, []);

  // Load athletes list
  const loadAthletes = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const res = await fetchAthletes();
      if (res.success && res.data.length > 0) {
        setAthletesList(res.data);
      } else if (athletesList.length === 0) {
        // Fallback initial sample data if offline
        setAthletesList([
          {
            id: 1,
            full_name: 'Fadli Rahman Caniago',
            nik: '1371011505020001',
            gender: 'Putra',
            contingent_name: 'Kota Padang',
            sport_name: 'Pencak Silat',
            achievements: 'Medali Emas Kejurda Sumbar 2024 Kelas F',
            is_verified: true,
          },
          {
            id: 2,
            full_name: 'Annisa Rahmadani Putri',
            nik: '1375022010030002',
            gender: 'Putri',
            contingent_name: 'Kota Bukittinggi',
            sport_name: 'Pencak Silat',
            achievements: 'Perak Porprov Sumbar 2023 Tunggal Putri',
            is_verified: true,
          },
          {
            id: 3,
            full_name: 'Muhammad Ilham Pratama',
            nik: '1306010908000004',
            gender: 'Putra',
            contingent_name: 'Kabupaten Agam',
            sport_name: 'Atletik',
            achievements: 'Emas Lari 100m Kejurnas Yunior',
            is_verified: true,
          },
          {
            id: 4,
            full_name: 'Suci Ramadhani Syahrir',
            nik: '1304021802040005',
            gender: 'Putri',
            contingent_name: 'Kabupaten Tanah Datar',
            sport_name: 'Atletik',
            achievements: 'Emas Lompat Jauh Porprov Sumbar',
            is_verified: true,
          },
        ]);
      }
    } finally {
      setIsLoadingList(false);
    }
  }, [athletesList.length]);

  useEffect(() => {
    loadMetadata();
    loadAthletes();
  }, [loadMetadata, loadAthletes]);

  // Form input change handler
  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear notifications on editing
    if (submitSuccess) setSubmitSuccess(null);
    if (submitError) setSubmitError(null);
  };

  // Calculate age if birth_date is selected
  const calculatedAge = useMemo(() => {
    if (!formData.birth_date) return null;
    const birth = new Date(formData.birth_date);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [formData.birth_date]);

  // Handle Form Submit
  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(null);
    setSubmitError(null);

    // Validation
    if (!formData.full_name.trim()) {
      setSubmitError('Nama lengkap atlet wajib diisi.');
      setIsSubmitting(false);
      return;
    }

    if (!formData.nik.trim() || formData.nik.trim().length !== 16) {
      setSubmitError('NIK harus berupa 16 digit angka sesuai KTP/KK.');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        _token: csrfToken,
      };

      const res = await submitAthleteData(payload);

      if (res.success) {
        // Add to local list immediately for instant UI feedback
        const contingentObj = contingents.find(c => String(c.id) === String(formData.contingent_id));
        const sportObj = sports.find(s => String(s.id) === String(formData.sport_id));

        const newAthlete = {
          id: Date.now(),
          full_name: formData.full_name,
          nik: formData.nik,
          gender: formData.gender === 'L' ? 'Putra' : 'Putri',
          contingent_name: contingentObj ? contingentObj.name : 'Kontingen',
          sport_name: sportObj ? sportObj.name.split(' (')[0] : 'Cabor',
          achievements: formData.achievements || '-',
          is_verified: formData.is_verified,
        };

        setAthletesList(prev => [newAthlete, ...prev]);
        setSubmitSuccess({
          name: formData.full_name,
          contingent: contingentObj ? contingentObj.name : '',
          sport: sportObj ? sportObj.name : '',
          nik: formData.nik,
        });

        // Reset form to blank defaults
        setFormData({
          ...initialFormState,
          contingent_id: formData.contingent_id,
          sport_id: formData.sport_id,
        });

        // Re-fetch backend list
        setTimeout(() => {
          loadAthletes();
        }, 1200);
      } else {
        setSubmitError(res.error || 'Gagal menyimpan data atlet ke server.');
      }
    } catch (err) {
      setSubmitError(err.message || 'Terjadi kesalahan saat memproses data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Athletes list
  const filteredAthletes = useMemo(() => {
    return athletesList.filter(item => {
      const matchSearch =
        !searchFilter.trim() ||
        item.full_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.nik?.includes(searchFilter) ||
        item.contingent_name?.toLowerCase().includes(searchFilter.toLowerCase());

      const matchContingent =
        !selectedContingentFilter || item.contingent_name?.includes(selectedContingentFilter);

      const matchSport =
        !selectedSportFilter || item.sport_name?.includes(selectedSportFilter);

      return matchSearch && matchContingent && matchSport;
    });
  }, [athletesList, searchFilter, selectedContingentFilter, selectedSportFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = athletesList.length;
    const verified = athletesList.filter(a => a.is_verified).length;
    const male = athletesList.filter(a => a.gender === 'Putra' || a.gender === 'L').length;
    const female = athletesList.filter(a => a.gender === 'Putri' || a.gender === 'P').length;
    return { total, verified, male, female };
  }, [athletesList]);

  return (
    <div className="athlete-module">
      {/* Top Navigation Bar */}
      <div className="athlete-header-bar">
        <div className="athlete-header-left">
          {onBackToStandings && (
            <button
              onClick={onBackToStandings}
              className="btn-back-nav"
              title="Kembali ke Klasemen Medali"
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Klasemen</span>
            </button>
          )}

          <div className="athlete-title-group">
            <div className="athlete-badge-pill">
              <span className="pulse-dot"></span>
              PORTAL ENTRI ATLET
            </div>
            <h2>Manajemen & Registrasi Data Atlet</h2>
            <p className="athlete-subtitle">
              Sistem Pendaftaran Atlet Pekan Olahraga Provinsi Sumatera Barat 2026
            </p>
          </div>
        </div>

        {/* Endpoint Indicator */}
        <div className="endpoint-indicator-box">
          <div className="endpoint-tag">
            <span
              className={`status-dot ${
                endpointStatus === 'connected'
                  ? 'dot-green'
                  : endpointStatus === 'checking'
                  ? 'dot-yellow'
                  : 'dot-red'
              }`}
            ></span>
            <span className="endpoint-name">API Server Endpoint</span>
          </div>
          <code className="endpoint-url" title={ADMIN_ATHLETES_URL}>
            {ADMIN_ATHLETES_URL}
          </code>
          <div className="endpoint-aux">
            <span className="endpoint-method">POST</span>
            <span>Auth: Laravel Session / CSRF</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="athlete-stats-grid">
        <div className="athlete-stat-card">
          <div className="stat-icon-wrapper icon-users">
            <Users size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-title">Total Atlet Terdaftar</span>
            <span className="stat-num">{stats.total}</span>
          </div>
        </div>

        <div className="athlete-stat-card">
          <div className="stat-icon-wrapper icon-verified">
            <ShieldCheck size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-title">Terverifikasi Sah</span>
            <span className="stat-num">{stats.verified}</span>
          </div>
        </div>

        <div className="athlete-stat-card">
          <div className="stat-icon-wrapper icon-gender">
            <Activity size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-title">Komposisi Gender</span>
            <span className="stat-num">
              {stats.male} <span className="stat-sub">Putra</span> / {stats.female} <span className="stat-sub">Putri</span>
            </span>
          </div>
        </div>

        <div className="athlete-stat-card">
          <div className="stat-icon-wrapper icon-cabor">
            <Award size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-title">Cabang Olahraga</span>
            <span className="stat-num">{sports.length} Cabor</span>
          </div>
        </div>
      </div>

      {/* Tabs Selector: Form vs List */}
      <div className="athlete-tab-nav">
        <button
          className={`tab-btn ${activeSubTab === 'form' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveSubTab('form')}
        >
          <UserPlus size={18} />
          <span>Form Entri Atlet Baru</span>
        </button>

        <button
          className={`tab-btn ${activeSubTab === 'list' ? 'tab-btn-active' : ''}`}
          onClick={() => {
            setActiveSubTab('list');
            loadAthletes();
          }}
        >
          <Users size={18} />
          <span>Database Atlet ({athletesList.length})</span>
        </button>
      </div>

      {/* SUCCESS BANNER */}
      {submitSuccess && (
        <div className="success-banner">
          <div className="success-icon-box">
            <CheckCircle2 size={24} color="#10B981" />
          </div>
          <div className="success-content">
            <h4>Pendaftaran Atlet Berhasil!</h4>
            <p>
              Atlet <strong>{submitSuccess.name}</strong> (NIK: <code>{submitSuccess.nik}</code>) berhasil
              didaftarkan ke <strong>{submitSuccess.contingent}</strong> pada cabor{' '}
              <strong>{submitSuccess.sport}</strong> melalui endpoint <code>{ADMIN_ATHLETES_URL}</code>.
            </p>
          </div>
          <button
            className="btn-close-banner"
            onClick={() => setSubmitSuccess(null)}
            title="Tutup pemberitahuan"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ERROR BANNER */}
      {submitError && (
        <div className="error-banner">
          <div className="error-icon-box">
            <AlertCircle size={24} color="#EF4444" />
          </div>
          <div className="error-content">
            <h4>Gagal Memproses Data</h4>
            <p>{submitError}</p>
          </div>
          <button
            className="btn-close-banner"
            onClick={() => setSubmitError(null)}
            title="Tutup pemberitahuan"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* TAB 1: FORM ENTRI */}
      {activeSubTab === 'form' && (
        <div className="form-card-container">
          <div className="form-header">
            <div className="form-title-badge">
              <Sparkles size={16} />
              <span>Formulir Pendaftaran Resmi</span>
            </div>
            <h3>Entri Data Atlet PORPROV SUMBAR 2026</h3>
            <p className="form-desc">
              Data yang dikirimkan akan disimpan ke database panitia melalui target endpoint:{' '}
              <code>{ADMIN_ATHLETES_URL}</code>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="athlete-form">
            {/* Section 1: Identitas Atlet */}
            <div className="form-section">
              <div className="section-legend">
                <span className="legend-number">1</span>
                <span>Identitas Utama Atlet</span>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="full_name">
                    Nama Lengkap Atlet <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Contoh: Fadli Rahman Caniago"
                    required
                    className="form-control"
                  />
                  <span className="field-hint">Sesuai nama yang tertera di KTP / Akta Kelahiran</span>
                </div>

                <div className="form-group">
                  <label htmlFor="nik">
                    Nomor Induk Kependudukan (NIK) <span className="req-star">*</span>
                    <span
                      className={`nik-counter ${
                        formData.nik.length === 16
                          ? 'nik-valid'
                          : formData.nik.length > 0
                          ? 'nik-invalid'
                          : ''
                      }`}
                    >
                      {formData.nik.length}/16 Digit
                    </span>
                  </label>
                  <input
                    type="text"
                    id="nik"
                    name="nik"
                    maxLength={16}
                    value={formData.nik}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData(prev => ({ ...prev, nik: val }));
                    }}
                    placeholder="16 Digit NIK KTP / Kartu Keluarga"
                    required
                    className="form-control font-mono"
                  />
                  <span className="field-hint">16 digit angka kependudukan Sumatera Barat</span>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Jenis Kelamin <span className="req-star">*</span></label>
                <div className="gender-selector">
                  <label className={`gender-option ${formData.gender === 'L' ? 'gender-selected' : ''}`}>
                    <input
                      type="radio"
                      name="gender"
                      value="L"
                      checked={formData.gender === 'L'}
                      onChange={handleInputChange}
                    />
                    <span className="gender-icon">👨</span>
                    <div className="gender-text">
                      <strong>Laki-laki (Putra)</strong>
                      <small>Kategori Tanding Putra</small>
                    </div>
                  </label>

                  <label className={`gender-option ${formData.gender === 'P' ? 'gender-selected' : ''}`}>
                    <input
                      type="radio"
                      name="gender"
                      value="P"
                      checked={formData.gender === 'P'}
                      onChange={handleInputChange}
                    />
                    <span className="gender-icon">👩</span>
                    <div className="gender-text">
                      <strong>Perempuan (Putri)</strong>
                      <small>Kategori Tanding Putri</small>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 2: Kontingen & Cabang Olahraga */}
            <div className="form-section">
              <div className="section-legend">
                <span className="legend-number">2</span>
                <span>Asal Kontingen & Cabang Olahraga</span>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="contingent_id">
                    Kontingen Asal Daerah <span className="req-star">*</span>
                  </label>
                  <select
                    id="contingent_id"
                    name="contingent_id"
                    value={formData.contingent_id}
                    onChange={handleInputChange}
                    required
                    className="form-control form-select"
                  >
                    <option value="">-- Pilih Kontingen Kabupaten/Kota --</option>
                    {contingents.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <span className="field-hint">Kabupaten / Kota yang diwakili atlet</span>
                </div>

                <div className="form-group">
                  <label htmlFor="sport_id">
                    Cabang Olahraga (Cabor) <span className="req-star">*</span>
                  </label>
                  <select
                    id="sport_id"
                    name="sport_id"
                    value={formData.sport_id}
                    onChange={handleInputChange}
                    required
                    className="form-control form-select"
                  >
                    <option value="">-- Pilih Cabang Olahraga --</option>
                    {sports.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <span className="field-hint">Cabor pertandingan PORPROV 2026</span>
                </div>
              </div>
            </div>

            {/* Section 3: Data Kelahiran & Fisik */}
            <div className="form-section">
              <div className="section-legend">
                <span className="legend-number">3</span>
                <span>Data Kelahiran & Postur Fisik</span>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="birth_place">Tempat Lahir</label>
                  <input
                    type="text"
                    id="birth_place"
                    name="birth_place"
                    value={formData.birth_place}
                    onChange={handleInputChange}
                    placeholder="Contoh: Bukittinggi"
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="birth_date">
                    Tanggal Lahir
                    {calculatedAge !== null && (
                      <span className="age-badge">Usia: {calculatedAge} Tahun</span>
                    )}
                  </label>
                  <input
                    type="date"
                    id="birth_date"
                    name="birth_date"
                    value={formData.birth_date}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-grid-2" style={{ marginTop: '16px' }}>
                <div className="form-group">
                  <label htmlFor="height_cm">Tinggi Badan (cm)</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      id="height_cm"
                      name="height_cm"
                      min="100"
                      max="250"
                      value={formData.height_cm}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                    <span className="unit-label">cm</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="weight_kg">Berat Badan (kg)</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      id="weight_kg"
                      name="weight_kg"
                      min="30"
                      max="200"
                      value={formData.weight_kg}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                    <span className="unit-label">kg</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Riwayat Prestasi & Verifikasi */}
            <div className="form-section">
              <div className="section-legend">
                <span className="legend-number">4</span>
                <span>Riwayat Prestasi & Keabsahan</span>
              </div>

              <div className="form-group">
                <label htmlFor="achievements">Prestasi Utama / Riwayat Medali</label>
                <textarea
                  id="achievements"
                  name="achievements"
                  rows={3}
                  value={formData.achievements}
                  onChange={handleInputChange}
                  placeholder="Contoh: Medali Emas Kejurda Sumbar 2024, Medali Perak Popda 2023..."
                  className="form-control textarea-control"
                ></textarea>
                <span className="field-hint">Catatan rekor atau medali yang pernah diraih atlet</span>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label htmlFor="photo_url">URL Foto Atlet</label>
                <input
                  type="text"
                  id="photo_url"
                  name="photo_url"
                  value={formData.photo_url}
                  onChange={handleInputChange}
                  placeholder="/images/athletes/default.jpg"
                  className="form-control"
                />
              </div>

              <div className="verification-toggle-box">
                <label className="custom-checkbox-container">
                  <input
                    type="checkbox"
                    id="is_verified"
                    name="is_verified"
                    checked={formData.is_verified}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-checkmark"></span>
                  <div className="verification-label-text">
                    <strong>Verifikasi Keabsahan Atlet Langsung (Verified Status)</strong>
                    <p>Centang jika dokumen NIK, domisili, dan surat rekomendasi cabor telah diperiksa sah.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="form-actions-bar">
              <button
                type="button"
                className="btn-reset"
                onClick={() => setFormData(initialFormState)}
                disabled={isSubmitting}
              >
                Reset Formulir
              </button>

              <button
                type="submit"
                className="btn-submit-athlete"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={18} className="spin-icon" />
                    <span>Mendaftarkan ke Server...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Daftarkan Atlet ke Endpoint</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: DATABASE ATLET */}
      {activeSubTab === 'list' && (
        <div className="athlete-list-container">
          {/* List Toolbar */}
          <div className="athlete-list-toolbar">
            <div className="search-box-athlete">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Cari Nama Atlet, NIK, atau Daerah..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="athlete-filters">
              <select
                className="filter-select"
                value={selectedContingentFilter}
                onChange={e => setSelectedContingentFilter(e.target.value)}
              >
                <option value="">Semua Kontingen Daerah</option>
                {contingents.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                className="filter-select"
                value={selectedSportFilter}
                onChange={e => setSelectedSportFilter(e.target.value)}
              >
                <option value="">Semua Cabor</option>
                {sports.map(s => (
                  <option key={s.id} value={s.name.split(' (')[0]}>
                    {s.name}
                  </option>
                ))}
              </select>

              <button
                className="btn-reload-list"
                onClick={loadAthletes}
                disabled={isLoadingList}
                title="Muat ulang dari http://127.0.0.1:8002/admin/athletes"
              >
                <RefreshCw size={16} className={isLoadingList ? 'spin-icon' : ''} />
                <span>{isLoadingList ? 'Sinkronisasi...' : 'Segarkan'}</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="athletes-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }} className="text-center">No</th>
                  <th>Nama Lengkap & NIK</th>
                  <th>Kontingen Daerah</th>
                  <th>Cabang Olahraga</th>
                  <th>Prestasi Utama</th>
                  <th className="text-center" style={{ width: '130px' }}>Keabsahan</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingList ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="skeleton-row">
                      <td className="text-center">
                        <div className="skeleton-box" style={{ width: '25px', margin: '0 auto' }}></div>
                      </td>
                      <td>
                        <div className="skeleton-box" style={{ width: '160px' }}></div>
                      </td>
                      <td><div className="skeleton-box" style={{ width: '120px' }}></div></td>
                      <td><div className="skeleton-box" style={{ width: '100px' }}></div></td>
                      <td><div className="skeleton-box" style={{ width: '180px' }}></div></td>
                      <td><div className="skeleton-box" style={{ width: '80px', margin: '0 auto' }}></div></td>
                    </tr>
                  ))
                ) : filteredAthletes.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <div className="empty-icon">🏃‍♂️</div>
                        <h4>Tidak Ada Data Atlet</h4>
                        <p>
                          {searchFilter || selectedContingentFilter || selectedSportFilter
                            ? 'Tidak ada atlet yang cocok dengan filter pencarian.'
                            : 'Belum ada data atlet yang terdaftar.'}
                        </p>
                        <button
                          className="btn-submit-athlete"
                          style={{ marginTop: '14px', padding: '8px 16px', fontSize: '0.85rem' }}
                          onClick={() => setActiveSubTab('form')}
                        >
                          <UserPlus size={16} />
                          <span>Daftarkan Atlet Sekarang</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAthletes.map((athlete, idx) => (
                    <tr key={athlete.id || idx}>
                      <td className="text-center index-col">{idx + 1}</td>

                      <td>
                        <div className="athlete-name-cell">
                          <div className="athlete-avatar-circle">
                            {athlete.full_name ? athlete.full_name.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div>
                            <div className="athlete-name-text">{athlete.full_name}</div>
                            <div className="athlete-meta-text">
                              <span>NIK: <code>{athlete.nik}</code></span>
                              <span className="meta-bullet">•</span>
                              <span className="gender-tag">{athlete.gender}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="contingent-tag-cell">
                          <MapPin size={14} color="#F43F5E" />
                          <span>{athlete.contingent_name}</span>
                        </div>
                      </td>

                      <td>
                        <span className="sport-pill-badge">
                          {athlete.sport_name}
                        </span>
                      </td>

                      <td>
                        <div className="achievement-cell-text" title={athlete.achievements}>
                          {athlete.achievements && athlete.achievements !== '-' ? (
                            <span>{athlete.achievements}</span>
                          ) : (
                            <span className="text-muted">- Belum ada riwayat -</span>
                          )}
                        </div>
                      </td>

                      <td className="text-center">
                        {athlete.is_verified ? (
                          <span className="badge-verified" title="Keabsahan atlet sah dan terverifikasi">
                            <Check size={12} />
                            <span>Terverifikasi</span>
                          </span>
                        ) : (
                          <span className="badge-pending" title="Menunggu verifikasi keabsahan">
                            <span>Pending</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer-info">
            <span>
              Menampilkan <strong>{filteredAthletes.length}</strong> dari <strong>{athletesList.length}</strong> atlet terdaftar
            </span>
            <div className="direct-admin-link">
              <span>Akses langsung portal Laravel:</span>
              <a
                href={ADMIN_ATHLETES_URL}
                target="_blank"
                rel="noreferrer"
                className="btn-external-link"
              >
                <span>{ADMIN_ATHLETES_URL}</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
