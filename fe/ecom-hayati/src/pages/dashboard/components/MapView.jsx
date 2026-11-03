// Peta hanya-baca (Leaflet): satu titik lokasi. Memakai layer, kontrol, dan marker yang sama dengan MapPicker
// supaya tampil seragam; bedanya tidak ada pencarian dan klik/geser untuk memilih titik.
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { addBaseLayers } from './mapLayers';

const icon = L.icon({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
const PICK_ZOOM = 15; // sama dengan MapPicker saat titik sudah ada

function MapView({ latitude, longitude, label }) {
  const elRef = useRef(null);
  const lat = Number(latitude);
  const lng = Number(longitude);
  const valid = latitude !== '' && latitude != null && longitude !== '' && longitude != null && Number.isFinite(lat) && Number.isFinite(lng);

  useEffect(() => {
    if (!valid) return undefined;
    const map = L.map(elRef.current, { scrollWheelZoom: false }).setView([lat, lng], PICK_ZOOM);
    addBaseLayers(map);
    const marker = L.marker([lat, lng], { icon }).addTo(map);
    if (label) marker.bindTooltip(label, { direction: 'top', offset: [0, -36] });
    const timer = setTimeout(() => map.invalidateSize(), 150); // ukuran bisa belum final saat modal baru terbuka
    return () => { clearTimeout(timer); map.remove(); };
  }, [valid, lat, lng, label]);

  if (!valid) return <p className="dash-map-empty">Koordinat belum diisi, peta tidak dapat ditampilkan.</p>;
  return <div ref={elRef} className="dash-map dash-map-view" role="img" aria-label={`Peta lokasi${label ? ` ${label}` : ''}`} />;
}

export default MapView;
