// ============================================================
// SearchBar.jsx — Barre de recherche globale du site
//
// Fonctionnement :
//   1. L'utilisateur clique sur la loupe → le champ de saisie s'ouvre
//   2. À chaque frappe, les entrées de searchIndex.js sont filtrées
//   3. Les suggestions s'affichent (max 7) avec la saisie surlignée
//   4. La navigation clavier (↑ ↓ Entrée Échap) est entièrement supportée
//   5. Un clic sur une suggestion navigue vers la route correspondante
//      (les ancres de type '/#agenda' déclenchent un scroll smooth)
// ============================================================
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import searchIndex from '@data/searchIndex';
import { normalize } from '@utils/string';
import './SearchBar.scss';
/** Limite de suggestions affichées simultanément (évite la surcharge visuelle). */
const MAX_SUGGESTIONS = 7;
/** Délai (ms) avant scroll vers une ancre après navigation route. */
const SCROLL_TO_ANCHOR_DELAY = 100;
export default function SearchBar() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  // -1 = aucune suggestion sélectionnée au clavier
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  // setTimeout retourne `number` côté navigateur (vs NodeJS.Timeout côté serveur).
  // useRef accepte la valeur `null` initiale puis le handle après setTimeout.
  const scrollTimer = useRef(null);
  const navigate = useNavigate();
  // Quand la barre s'ouvre : met le focus sur le champ de saisie.
  // Quand elle se ferme : réinitialise tous les états (reset au close = pattern légitime).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) inputRef.current?.focus();
    else {
      setQuery('');
      setSuggestions([]);
      setActiveIndex(-1);
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */
  // Ferme la barre si l'utilisateur clique en dehors — actif uniquement quand open est true
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        wrapperRef.current &&
        e.target instanceof Node &&
        !wrapperRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);
  // Filtre les suggestions à chaque frappe au clavier
  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1); // réinitialise la sélection clavier
    // Rien à rechercher si le champ est vide
    if (val.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    // Normalise la saisie (sans accents, en minuscule)
    const q = normalize(val.trim());
    // Filtre : une entrée correspond si son label contient la saisie
    //          OU si un de ses mots-clés commence par la saisie
    const results = searchIndex.filter((item) => {
      const labelMatch = normalize(item.label).includes(q);
      const keywordMatch = item.keywords.some((kw) => normalize(kw).startsWith(q));
      return labelMatch || keywordMatch;
    });
    setSuggestions(results.slice(0, MAX_SUGGESTIONS));
  };
  // Navigue vers la destination d'une suggestion
  const goTo = (item) => {
    setOpen(false);
    // Si la route contient une ancre (ex: '/#agenda'), navigue d'abord vers la page
    // puis scrolle jusqu'à l'élément avec cet id après un court délai (temps de rendu).
    if (item.to.includes('#')) {
      const [path, hash] = item.to.split('#');
      navigate(path || '/');
      if (scrollTimer.current !== null) window.clearTimeout(scrollTimer.current);
      scrollTimer.current = window.setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      }, SCROLL_TO_ANCHOR_DELAY);
    } else {
      // Route simple : navigation directe
      navigate(item.to);
    }
  };
  // Gère la navigation clavier dans la liste des suggestions
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault(); // empêche le scroll de la page
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      // Valide la suggestion sélectionnée au clavier, ou la première si aucune sélectionnée
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        goTo(suggestions[activeIndex]);
      } else if (suggestions.length > 0) {
        goTo(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };
  // Surligne la partie du label qui correspond à la saisie.
  // Retourne soit la string brute, soit un fragment JSX avec <mark>.
  const highlight = (label) => {
    if (!query.trim()) return label; // rien à surligner
    const q = normalize(query.trim());
    const norm = normalize(label);
    const idx = norm.indexOf(q); // position de la saisie dans le label normalisé
    if (idx === -1) return label;
    return (
      <>
        {label.slice(0, idx)}
        <mark className="search__highlight">{label.slice(idx, idx + q.length)}</mark>
        {label.slice(idx + q.length)}
      </>
    );
  };
  return (
    // Wrapper global : détecte les clics en dehors via wrapperRef
    <div className="search" ref={wrapperRef}>
      {/* Bouton icône loupe — bascule l'ouverture/fermeture de la barre */}
      <button
        type="button"
        className={`search__toggle ${open ? 'search__toggle--active' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={t('search.rechercher')}
        aria-expanded={open}
      >
        <FiSearch size={18} />
      </button>

      {/* Panel de recherche — rendu uniquement quand open est true */}
      {open && (
        <div className="search__panel">
          <div className="search__input-wrapper">
            {/* Icône décorative à gauche du champ */}
            <FiSearch className="search__input-icon" size={15} />
            <input
              ref={inputRef}
              className="search__input"
              type="text"
              placeholder={t('search.placeholder')}
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              aria-label={t('search.placeholder')}
              autoComplete="off"
            />
            {/* Bouton "effacer" — visible uniquement si du texte est saisi */}
            {query && (
              <button
                type="button"
                className="search__clear"
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                  inputRef.current?.focus();
                }}
                aria-label={t('search.effacer')}
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          {/* Wrapper aria-live pour annoncer aux lecteurs d'écran les changements
                de résultats sans interrompre la frappe. Reste toujours présent
                (même vide) pour que le screen reader détecte les mises à jour. */}
          <div aria-live="polite" aria-atomic="false">
            {/* Annonce textuelle du nombre de résultats (visible uniquement par les lecteurs d'écran) */}
            {query.trim().length > 0 && (
              <p className="sr-only">
                {suggestions.length === 0
                  ? `${t('search.aucunResultat')} « ${query} »`
                  : `${suggestions.length} ${suggestions.length > 1 ? 'résultats' : 'résultat'}`}
              </p>
            )}

            {/* Liste des suggestions — role="listbox" pour l'accessibilité */}
            {suggestions.length > 0 && (
              <ul className="search__suggestions" role="listbox">
                {suggestions.map((item, i) => (
                  <li
                    key={item.to + item.label}
                    role="option"
                    aria-selected={i === activeIndex}
                    className={`search__suggestion ${i === activeIndex ? 'search__suggestion--active' : ''}`}
                    // onMouseDown plutôt que onClick pour éviter la perte de focus avant la navigation
                    onMouseDown={() => goTo(item)}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    <FiSearch className="search__suggestion-icon" size={12} />
                    <span>{highlight(item.label)}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Message "aucun résultat" visible — affiché si la saisie ne retourne rien */}
            {query.trim().length > 0 && suggestions.length === 0 && (
              <p className="search__empty">
                {t('search.aucunResultat')} « {query} »
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
