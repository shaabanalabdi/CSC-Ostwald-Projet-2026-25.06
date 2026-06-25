import { useState } from 'react';
import { downloadCsv, isApiError } from '@api/client';
export default function ExportCsvButton({
  path,
  filename,
  className,
  disabled,
  label = 'Exporter CSV',
}) {
  const [state, setState] = useState('idle');
  const [errorMsg, setErrorMsg] = useState(null);
  const handleClick = async () => {
    setState('pending');
    setErrorMsg(null);
    try {
      await downloadCsv(path, filename);
      setState('idle');
    } catch (err) {
      setErrorMsg(isApiError(err) ? err.message : 'Échec du téléchargement');
      setState('error');
      window.setTimeout(() => setState('idle'), 4000);
    }
  };
  let display = label;
  if (state === 'pending') display = 'Génération…';
  if (state === 'error') display = errorMsg ?? 'Échec';
  return (
    <button
      type="button"
      className={className}
      onClick={() => void handleClick()}
      disabled={disabled || state === 'pending'}
      aria-busy={state === 'pending'}
    >
      {display}
    </button>
  );
}
