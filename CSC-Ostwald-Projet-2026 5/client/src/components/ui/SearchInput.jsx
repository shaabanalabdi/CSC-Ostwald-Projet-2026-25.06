import { FaSearch, FaTimes } from 'react-icons/fa';
import './SearchInput.scss';
export default function SearchInput({
  value,
  onChange,
  placeholder = 'Rechercher…',
  id = 'search-input',
  ariaLabel,
}) {
  return (
    <div className="search-input">
      <FaSearch className="search-input__icon" aria-hidden="true" />
      <input
        id={id}
        type="search"
        className="search-input__field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          className="search-input__clear"
          onClick={() => onChange('')}
          aria-label="Effacer la recherche"
        >
          <FaTimes aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
