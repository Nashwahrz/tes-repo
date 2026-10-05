// src/pages/MapPicker.jsx
// Peta OpenStreetMap (Leaflet): klik peta untuk menentukan latitude & longitude.
import { useEffect, useRef } from 'react';
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

const DEFAULT_CENTER = [-2.5, 118]; // Indonesia
const DEFAULT_ZOOM = 5;
const PICK_ZOOM = 15;

const toPoint = (lat, lng) => {
  if (lat === '' || lng === '') return null;
  const a = Number(lat);
  const b = Number(lng);
  if (Number.isNaN(a) || Number.isNaN(b) || a < -90 || a > 90 || b < -180 || b > 180) return null;
  return [a, b];
};

// Kolom DB decimal(x,7): batasi 7 digit di belakang koma
const round = (n) => Number(n.toFixed(7));

function MapPicker({ latitude, longitude, onPick }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  });

  // Buat peta sekali
  useEffect(() => {
    const start = toPoint(latitude, longitude);
    const map = L.map(elRef.current).setView(start || DEFAULT_CENTER, start ? PICK_ZOOM : DEFAULT_ZOOM);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    if (start) markerRef.current = L.marker(start, { icon }).addTo(map);

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
    else markerRef.current = L.marker(point, { icon }).addTo(map);

    if (!map.getBounds().contains(point)) map.panTo(point);
  }, [latitude, longitude]);

  return <div ref={elRef} className="dash-map" />;
}

export default MapPicker;
