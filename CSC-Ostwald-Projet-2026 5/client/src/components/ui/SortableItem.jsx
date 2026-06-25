// ============================================================
// SortableItem.jsx — wrapper léger autour du useSortable de
// @dnd-kit/sortable pour que les pages de liste admin restent lisibles.
// Rend une poignée de préhension + les enfants fournis, en appliquant le
// transform/transition pendant le glisser.
// ============================================================
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaGripVertical } from 'react-icons/fa';
import './SortableItem.scss';
export default function SortableItem({
  id,
  disabled,
  className,
  children,
  handleLabel = 'Réordonner',
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Soulève visuellement l'élément glissé + le place au-dessus de tout.
    opacity: isDragging ? 0.65 : 1,
    zIndex: isDragging ? 2 : 'auto',
    cursor: disabled ? 'default' : undefined,
  };
  return (
    <li ref={setNodeRef} style={style} className={className}>
      <button
        type="button"
        className="sortable-handle"
        aria-label={handleLabel}
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <FaGripVertical aria-hidden="true" />
      </button>
      {children}
    </li>
  );
}
