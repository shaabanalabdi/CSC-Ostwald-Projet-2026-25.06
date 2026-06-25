// ============================================================
// LeafletMap.jsx — Carte interactive RGPD-compliant
//
// Utilise OpenStreetMap (tuiles + données ouvertes) au lieu de Google Maps.
// Aucun cookie tiers, aucun envoi d'IP à Google. Conforme RGPD.
// ============================================================
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
// ⚠️ Leaflet CSS chargé MANUELLEMENT (pas via import) depuis /public/leaflet.css.
// Pourquoi : vite.config.js force leaflet dans un manualChunk, et Vite injecte
// alors leaflet.css comme <link rel="stylesheet"> render-blocking dans l'index.html
// principal — même quand LeafletMap n'est utilisé que sur la page Contact (lazy).
// Résultat : ~15 KB de CSS bloquant le LCP sur Accueil. Avec le chargement
// dynamique ci-dessous, le CSS n'est fetché que sur la page Contact.
// Le fichier est copié depuis node_modules/leaflet/dist/leaflet.css → public/.
import logoCsc from '@assets/images/logo_CSC_Ostwald.png';
const cscIcon = new L.Icon({
  iconUrl: logoCsc,
  iconSize: [48, 48], // taille rendue (px)
  iconAnchor: [24, 24], // point du logo correspondant à la coordonnée (centre)
  popupAnchor: [0, -22], // la bulle s'ouvre juste au-dessus du logo
  className: 'leaflet-csc-marker', // pour styliser (ombre, fond) si besoin
});
// ID unique pour le <link> dynamique — évite les doublons si LeafletMap
// est monté/démonté plusieurs fois (StrictMode, navigation rapide).
const LEAFLET_CSS_ID = 'leaflet-css-dynamic';
export default function LeafletMap({ lat, lng, zoom = 16, popup, ariaLabel }) {
  // Charge leaflet.css depuis /public/ uniquement quand la carte monte.
  // Le fichier est servi en cache long terme par Vite preview et tous les
  // CDN modernes (immutable hash via filename est moins nécessaire ici car
  // c'est un fichier statique de tiers, peu susceptible de changer).
  useEffect(() => {
    if (document.getElementById(LEAFLET_CSS_ID)) return;
    const link = document.createElement('link');
    link.id = LEAFLET_CSS_ID;
    link.rel = 'stylesheet';
    link.href = '/leaflet.css';
    document.head.appendChild(link);
  }, []);
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ width: '100%', height: '100%' }}
      aria-label={ariaLabel}
    >
      {/* Tuiles OpenStreetMap — gratuites, sans tracking, sans cookies */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={cscIcon}>
        {popup && <Popup>{popup}</Popup>}
      </Marker>
    </MapContainer>
  );
}
