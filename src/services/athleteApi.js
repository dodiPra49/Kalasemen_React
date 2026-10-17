/**
 * Service to interact with PORPROV 2026 Athletes Database
 * Backend Endpoints:
 * 1. Express REST API: http://127.0.0.1:5000/api/v1/athletes (Direct MySQL connection)
 * 2. Laravel Admin: http://127.0.0.1:8002/admin/athletes
 */

export const EXPRESS_API_URL = 'http://127.0.0.1:5000/api/v1';
export const LARAVEL_ADMIN_URL = 'http://127.0.0.1:8002/admin';

export const ADMIN_ATHLETES_URL = 'http://127.0.0.1:8002/admin/athletes';
export const ADMIN_CREATE_URL = 'http://127.0.0.1:8002/admin/athletes/create';

// Standard fallback options if backend cannot be reached
export const DEFAULT_CONTINGENTS = [
  { id: 1, name: 'Kota Padang' },
  { id: 2, name: 'Kota Bukittinggi' },
  { id: 3, name: 'Kabupaten Agam' },
  { id: 4, name: 'Kota Payakumbuh' },
  { id: 5, name: 'Kabupaten Tanah Datar' },
  { id: 6, name: 'Kota Solok' },
  { id: 7, name: 'Kabupaten Padang Pariaman' },
  { id: 8, name: 'Kota Pariaman' },
  { id: 9, name: 'Kabupaten Pesisir Selatan' },
  { id: 10, name: 'Kabupaten Lima Puluh Kota' },
];

export const DEFAULT_SPORTS = [
  { id: 1, name: 'Pencak Silat (Bela Diri)' },
  { id: 2, name: 'Sepak Takraw (Permainan)' },
  { id: 3, name: 'Atletik (Terukur)' },
  { id: 4, name: 'Renang (Terukur)' },
  { id: 5, name: 'Bulutangkis (Permainan)' },
  { id: 6, name: 'Karate (Bela Diri)' },
  { id: 7, name: 'Bola Voli (Permainan)' },
  { id: 8, name: 'Tenis Meja (Permainan)' },
  { id: 9, name: 'Taekwondo (Bela Diri)' },
  { id: 10, name: 'Futsal (Permainan)' },
];

/**
 * Fetch contingents and sports directly from the backend database
 */
export async function getCreatePageMetadata() {
  const meta = {
    success: true,
    csrfToken: null,
    contingents: DEFAULT_CONTINGENTS,
    sports: DEFAULT_SPORTS,
    endpointUsed: null,
  };

  // Try Express REST API first
  const endpoints = ['/api/v1', EXPRESS_API_URL];
  for (const base of endpoints) {
    try {
      const [resC, resS] = await Promise.all([
        fetch(`${base}/contingents`).then(r => r.ok ? r.json() : null),
        fetch(`${base}/sports`).then(r => r.ok ? r.json() : null),
      ]);

      if (resC?.data?.length > 0) meta.contingents = resC.data;
      if (resS?.data?.length > 0) meta.sports = resS.data;
      meta.endpointUsed = base;
      return meta;
    } catch {
      // Try next
    }
  }

  return meta;
}

/**
 * Fetch athletes list directly from database (via Express or Laravel)
 */
export async function fetchAthletes() {
  const endpoints = [
    '/api/v1/athletes?all=1',
    `${EXPRESS_API_URL}/athletes?all=1`,
    '/admin/athletes',
    ADMIN_ATHLETES_URL,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json, text/html' },
      });

      if (!res.ok) continue;

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (json && json.data) {
          return {
            success: true,
            data: json.data,
            total: json.total || json.count || json.data.length,
            source: url,
          };
        }
      }
    } catch {
      // Try next
    }
  }

  return {
    success: false,
    data: [],
    total: 0,
    error: 'Tidak dapat mengambil data atlet dari server.',
  };
}

/**
 * Submit athlete data to MySQL Database
 * Sends payload to Express REST API or Laravel Admin backend with true verification
 */
export async function submitAthleteData(athleteData) {
  const payload = {
    full_name: (athleteData.full_name || '').trim(),
    nik: (athleteData.nik || '').trim(),
    contingent_id: Number(athleteData.contingent_id || 1),
    sport_id: Number(athleteData.sport_id || 1),
    gender: athleteData.gender || 'L',
    birth_place: (athleteData.birth_place || '').trim(),
    birth_date: athleteData.birth_date || null,
    height_cm: athleteData.height_cm ? Number(athleteData.height_cm) : null,
    weight_kg: athleteData.weight_kg ? Number(athleteData.weight_kg) : null,
    achievements: (athleteData.achievements || '').trim(),
    photo_url: athleteData.photo_url || '/images/athletes/default.jpg',
    is_verified: athleteData.is_verified ? 1 : 0,
  };

  const targets = [
    // 1. Express REST API endpoint (direct MySQL INSERT with CORS enabled)
    { url: '/api/v1/athletes', type: 'json' },
    { url: `${EXPRESS_API_URL}/athletes`, type: 'json' },

    // 2. Laravel Admin endpoint (JSON request, CSRF excluded)
    { url: '/admin/athletes', type: 'json' },
    { url: ADMIN_ATHLETES_URL, type: 'json' },
  ];

  let lastErrorMessage = null;

  for (const target of targets) {
    try {
      const response = await fetch(target.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json().catch(() => null);

      if (response.ok && json && (json.success || json.data)) {
        return {
          success: true,
          message: json.message || 'Data atlet berhasil disimpan ke database!',
          endpoint: target.url,
          data: json.data,
        };
      }

      if (response.status === 422) {
        // Validation error (e.g. NIK already exists)
        return {
          success: false,
          error: json?.message || 'Data atlet tidak valid atau NIK sudah terdaftar.',
        };
      }

      if (json?.message) {
        lastErrorMessage = json.message;
      }
    } catch (err) {
      lastErrorMessage = err.message || 'Koneksi ke server gagal.';
    }
  }

  // If all attempts failed, report real error
  return {
    success: false,
    error: lastErrorMessage || 'Gagal menyimpan data atlet ke server. Pastikan server backend sedang berjalan.',
  };
}
