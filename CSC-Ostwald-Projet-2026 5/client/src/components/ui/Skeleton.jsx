import './Skeleton.scss';
export default function Skeleton({
  shape = 'rect',
  width,
  height,
  className = '',
  style,
  ...rest
}) {
  const classes = [
    'skeleton',
    shape === 'text' && 'skeleton--text',
    shape === 'circle' && 'skeleton--circle',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const inlineStyle = {
    ...style,
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : null),
    ...(height !== undefined
      ? { height: typeof height === 'number' ? `${height}px` : height }
      : null),
  };
  return <div className={classes} style={inlineStyle} aria-hidden="true" {...rest} />;
}
