// ============================================================
// AnimatedCheckmark.jsx — Icône SVG de confirmation animée
// Utilisée dans la modale de succès du formulaire bénévole.
// L'animation CSS (dessin du cercle + coche) est définie
// dans le fichier SCSS de la page via la classe passée en prop.
// ============================================================
export default function AnimatedCheckmark({ className }) {
  return (
    <svg viewBox="0 0 52 52" className={className}>
      {/* Cercle extérieur animé */}
      <circle cx="26" cy="26" r="25" fill="none" />
      {/* Coche animée */}
      <path fill="none" d="M14 27l8 8 16-16" />
    </svg>
  );
}
