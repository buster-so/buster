import type React from 'react';

export const CircleWithRing: React.FC<{
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  'data-value'?: string;
  color?: string;
}> = ({
  size = 10,
  'data-value': dataValue,
  className,
  style,
  color = 'currentColor',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-value={dataValue}
      {...props}>
      {/* Outer ring */}
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1" fill="none" />
      {/* Inner circle */}
      <circle cx="8" cy="8" r="4" fill={color} />
    </svg>
  );
};
