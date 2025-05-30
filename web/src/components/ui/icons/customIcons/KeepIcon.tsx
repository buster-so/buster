import type React from 'react';

export const KeepIcon: React.FC<{
  'data-value'?: string;
  color?: string;
  onClick?: () => void;
  size?: number;
}> = ({ 'data-value': dataValue, color = 'currentColor', onClick, size = 12 }) => {
  return (
    <svg
      {...(dataValue ? { 'data-value': dataValue } : {})}
      xmlns="http://www.w3.org/2000/svg"
      height={size}
      viewBox="0 -960 960 960"
      width={size}
      fill={color}
      onClick={onClick}>
      <title>Keep Icon</title>
      <path d="m640-480 80 80v80H520v240l-40 40-40-40v-240H240v-80l80-80v-280h-40v-80h400v80h-40v280Zm-286 80h252l-46-46v-314H400v314l-46 46Zm126 0Z" />
    </svg>
  );
};
