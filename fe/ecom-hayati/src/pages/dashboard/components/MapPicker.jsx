// src/pages/MapPicker.jsx
// Peta OpenStreetMap (Leaflet): klik peta untuk menentukan latitude & longitude.
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const icon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Opsi marker: bisa digeser (drag) untuk menyesuaikan titik
const markerOptions = { icon, draggable: true };

const DEFAULT_CENTER = [-0.9471, 100.4172]; // Padang, Sumatera Barat
const DEFAULT_ZOOM = 12; // Focus ke Padang & sekitarnya
const PICK_ZOOM = 15;
// Batas pencarian: Sumatera Barat (minLon,minLat,maxLon,maxLat)
const SUMBAR_BBOX = '98.4,-3.4,102.0,0.95';

const toPoint = (lat, lng) => {
  if (lat === '' || lng === '') return null;
  const a = Number(lat);
  const b = Number(lng);
  if (Number.isNaN(a) || Number.isNaN(b) || a < -90 || a > 90 || b < -180 || b > 180) return null;
  return [a, b];
};

// Kolom DB decimal(x,7): batasi 7 digit di belakang koma
const round = (n) => Number(n.toFixed(7));

const toLabel = (p) =>
  [p.name, p.street, p.district, p.city || p.county, p.state]
    .filter((v, idx, arr) => v && arr.indexOf(v) === idx)
    .join(', ');

// Samakan tulisan nama wilayah: buang awalan Kota/Kabupaten/Provinsi, huruf kecil, tanpa spasi/tanda baca ("Batubara" = "Batu Bara")
const squash = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
const norm = (t) => squash(t.toLowerCase().replace(/^(kota|kabupaten|kab\.?|kecamatan|kec\.?|provinsi|prov\.?|dki|di|daerah khusus ibukota|daerah istimewa)\s+/, ''));

// Zoom bila hasil tidak punya batas wilayah (extent), menurut tingkat wilayahnya
const LEVEL_ZOOM = { desa: 14, kecamatan: 13, kabupaten: 11, provinsi: 8 };

// Cache hasil pencarian per kalimat (selama halaman terbuka): mengedit kolom lain tidak memanggil ulang layanan
const photonCache = new Map();

// Photon publik kadang lambat/gagal sesaat: coba maksimal 2 kali, hasil hanya di-cache bila berhasil
async function photonSearch(q, signal) {
  if (photonCache.has(q)) return photonCache.get(q);
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(`https://photon.komoot.io/api/?limit=5&osm_tag=place&q=${encodeURIComponent(q)}`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const features = (await res.json()).features ?? [];
      photonCache.set(q, features);
      return features;
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      lastErr = err;
    }
  }
  throw lastErr;
}

// Cari titik tengah wilayah. Semua tingkat dicari bersamaan (satu kali tunggu), lalu dipilih yang paling rinci
// yang cocok: desa -> kecamatan -> kabupaten/kota -> provinsi. Kolom kosong dilewati; kolom yang terisi harus ikut
// cocok pada hasil, supaya tidak salah tebak (mis. "Air Putih" di kabupaten lain).
// Mengembalikan { lat, lon, extent, label, level }, null bila tidak ada yang cocok; melempar error bila layanan gagal.
async function geocodeArea({ desa, kecamatan, kabupaten, provinsi }, signal) {
  const candidates = [
    desa && { level: 'desa', parts: [desa, kecamatan, kabupaten, provinsi], must: [desa, kecamatan, kabupaten] },
    kecamatan && { level: 'kecamatan', parts: [kecamatan, kabupaten, provinsi], must: [kecamatan, kabupaten] },
    kabupaten && { level: 'kabupaten', parts: [kabupaten, provinsi], must: [kabupaten] },
    provinsi && { level: 'provinsi', parts: [provinsi], must: [provinsi] },
  ].filter(Boolean);

  const settled = await Promise.allSettled(candidates.map(({ parts }) => photonSearch(parts.filter(Boolean).join(', '), signal)));
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

  for (let n = 0; n < candidates.length; n += 1) {
    if (settled[n].status !== 'fulfilled') continue;
    const { level, parts, must } = candidates[n];
    const f = settled[n].value.find((x) => {
      const hay = squash(Object.values(x.properties).join(' '));
      return must.filter(Boolean).every((m) => hay.includes(norm(m)));
    });
    if (f) return { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], extent: f.properties.extent, label: parts.filter(Boolean).join(', '), level };
  }
  // Tidak ada yang cocok: bila ada tingkat yang gagal diminta, itu error layanan (bukan "tidak ditemukan")
  if (settled.some((r) => r.status === 'rejected')) throw settled.find((r) => r.status === 'rejected').reason;
  return null;
}

// desa/kecamatan/kabupaten/provinsi (opsional): wilayah dari form; peta diarahkan ke sana dan pencarian diprioritaskan di sekitarnya
function MapPicker({ latitude, longitude, onPick, desa = '', kecamatan = '', kabupaten = '', provinsi = '' }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onPickRef = useRef(onPick);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('');
  const skipSearchRef = useRef(false);
  const skipReverseRef = useRef('');
  const [foundArea, setArea] = useState(null); // { lat, lon, label } hasil geocode terakhir
  const [areaStatus, setAreaStatus] = useState('');
  const hasRegion = [desa, kecamatan, kabupaten, provinsi].some((v) => v.trim().length >= 3);
  const area = hasRegion ? foundArea : null; // semua wilayah dikosongkan -> wilayah tidak dipakai

  useEffect(() => {
    onPickRef.current = onPick;
  });

  const createMarker = (map, point) => {
    const marker = L.marker(point, markerOptions).addTo(map);
    marker.on('dragend', () => {
      const { lat, lng } = marker.getLatLng();
      onPickRef.current(round(lat), round(lng));
    });
    return marker;
  };

  // Buat peta sekali
  useEffect(() => {
    const start = toPoint(latitude, longitude);
    const map = L.map(elRef.current).setView(start || DEFAULT_CENTER, start ? PICK_ZOOM : DEFAULT_ZOOM);
    // Layer Google Maps
    const googleStreets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps',
    });

    const googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps',
    });

    const googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps',
    });

    const googleTerrain = L.tileLayer('https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps',
    });

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    });

    // Default layer: Google Streets (mirip tampilan Google Maps)
    googleStreets.addTo(map);

    const baseLayers = {
      '🗺️ Google Maps': googleStreets,
      '🛰️ Google Satelit + Jalan': googleHybrid,
      '📷 Google Satelit Polos': googleSat,
      '⛰️ Google Medan (Terrain)': googleTerrain,
      '🌐 OpenStreetMap': osm,
    };

    L.control.layers(baseLayers, null, { position: 'topright' }).addTo(map);

    if (start) markerRef.current = createMarker(map, start);

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      onPickRef.current(round(lat), round(lng));
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sinkronkan marker dengan nilai input (klik peta atau ketik manual)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const point = toPoint(latitude, longitude);

    if (!point) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    if (markerRef.current) markerRef.current.setLatLng(point);
    else markerRef.current = createMarker(map, point);

    if (!map.getBounds().contains(point)) map.panTo(point);
  }, [latitude, longitude]);

  const flyTo = (lat, lng) => {
    onPickRef.current(round(lat), round(lng));
    mapRef.current?.setView([lat, lng], PICK_ZOOM);
  };

  // Wilayah diisi (kabupaten/kota, kecamatan, provinsi) -> arahkan peta ke sana.
  // Hanya menggeser tampilan; titik koordinat yang sudah dipilih tidak diubah.
  useEffect(() => {
    if (!hasRegion) return undefined;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setAreaStatus('Mencari wilayah di peta...');
      try {
        const found = await geocodeArea(
          { desa: desa.trim(), kecamatan: kecamatan.trim(), kabupaten: kabupaten.trim(), provinsi: provinsi.trim() },
          ctrl.signal,
        );
        setArea(found);
        setAreaStatus(found ? '' : 'Wilayah tidak ditemukan di peta; pilih lokasi secara manual.');
        const map = mapRef.current;
        if (!found || !map || markerRef.current) return;
        map.invalidateSize(); // ukuran peta bisa belum final saat modal baru terbuka
        if (found.extent) {
          const [minLon, maxLat, maxLon, minLat] = found.extent;
          map.fitBounds([[minLat, minLon], [maxLat, maxLon]], { maxZoom: 14 });
        } else {
          map.setView([found.lat, found.lon], LEVEL_ZOOM[found.level]);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setArea(null);
          setAreaStatus('Gagal memuat wilayah dari layanan peta. Ubah salah satu kolom wilayah untuk mencoba lagi.');
        }
      }
    }, 800);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [desa, kecamatan, kabupaten, provinsi]); // eslint-disable-line react-hooks/exhaustive-deps

  // Saran otomatis (debounce) lewat Photon (OpenStreetMap, tahan salah ketik), dibatasi Sumatera Barat
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || skipSearchRef.current) {
      skipSearchRef.current = false;
      return undefined;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setStatus('Mencari...');
      try {
        // Ada wilayah dari form: prioritaskan di sekitarnya (tanpa batas Sumbar). Tanpa wilayah: batasi Sumatera Barat.
        const bias = area ? `lat=${area.lat}&lon=${area.lon}&location_bias_scale=0.8` : `lat=${DEFAULT_CENTER[0]}&lon=${DEFAULT_CENTER[1]}&bbox=${SUMBAR_BBOX}`;
        const url = `https://photon.komoot.io/api/?limit=8&${bias}&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { signal: ctrl.signal });
        const json = await res.json();
        const data = (json.features || []).map((f, i) => {
          const p = f.properties;
          return { place_id: `${p.osm_id}-${i}`, display_name: toLabel(p), lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] };
        });
        setResults(data);
        setStatus(data.length ? '' : 'Lokasi tidak ditemukan.');
      } catch (err) {
        if (err.name !== 'AbortError') setStatus('Gagal mencari lokasi.');
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, area]);

  // Koordinat berubah (klik peta, geser marker, lokasi saya, ketik manual) -> isi kotak dengan alamatnya
  useEffect(() => {
    const point = toPoint(latitude, longitude);
    if (!point) return undefined;
    const key = `${point[0]},${point[1]}`;
    if (skipReverseRef.current === key) return undefined; // titik berasal dari hasil pencarian
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/reverse?lat=${point[0]}&lon=${point[1]}`, { signal: ctrl.signal });
        const json = await res.json();
        const label = json.features?.[0] ? toLabel(json.features[0].properties) : '';
        if (label) {
          if (label.length >= 2) skipSearchRef.current = true;
          setQuery(label);
          setResults([]);
          setStatus('');
        }
      } catch {
        /* abaikan: kotak pencarian tetap apa adanya */
      }
    }, 600);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [latitude, longitude]);

  const pickResult = (r) => {
    skipReverseRef.current = `${round(Number(r.lat))},${round(Number(r.lon))}`;
    flyTo(Number(r.lat), Number(r.lon));
    setResults([]);
    skipSearchRef.current = true;
    setQuery(r.display_name);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setStatus('Browser tidak mendukung geolokasi.');
      return;
    }
    setStatus('Mengambil lokasi...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus('');
        flyTo(pos.coords.latitude, pos.coords.longitude);
      },
      () => setStatus('Tidak bisa mengambil lokasi (izin ditolak?).'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div>
      <div className="dash-map-search">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            if (v.trim().length < 2) {
              setResults([]);
              setStatus('');
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
          placeholder="Ketik alamat / nama tempat..."
        />
        <button type="button" onClick={useMyLocation}>📍 Lokasi saya</button>
      </div>
      {hasRegion && areaStatus && <p className="dash-map-hint">{areaStatus}</p>}
      {area && <p className="dash-map-hint">Pencarian diprioritaskan di sekitar: {area.label}</p>}
      {status && <p className="dash-map-hint">{status}</p>}
      {results.length > 0 && (
        <ul className="dash-map-results">
          {results.map((r) => (
            <li key={r.place_id}>
              <button type="button" onClick={() => pickResult(r)}>{r.display_name}</button>
            </li>
          ))}
        </ul>
      )}
      <div ref={elRef} className="dash-map" />
    </div>
  );
}

export default MapPicker;
