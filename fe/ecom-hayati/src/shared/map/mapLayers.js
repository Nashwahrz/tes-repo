// Layer dasar peta bersama (Leaflet): dipakai MapPicker dan MapView agar semua peta tampil seragam.
// Bawaan: Google Maps; pilihan lain lewat kontrol layer di pojok kanan atas.
import L from 'leaflet';

const google = (lyrs) => L.tileLayer(`https://{s}.google.com/vt/lyrs=${lyrs}&x={x}&y={y}&z={z}`, {
  maxZoom: 20,
  subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  attribution: '&copy; Google Maps',
});

export function addBaseLayers(map) {
  const googleStreets = google('m');
  const baseLayers = {
    '🗺️ Google Maps': googleStreets,
    '🛰️ Google Satelit + Jalan': google('y'),
    '📷 Google Satelit Polos': google('s'),
    '⛰️ Google Medan (Terrain)': google('p'),
    '🌐 OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }),
  };
  googleStreets.addTo(map);
  L.control.layers(baseLayers, null, { position: 'topright' }).addTo(map);
}
