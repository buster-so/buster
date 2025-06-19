import React from 'react';

export const StarsIcon: React.FC<{
  'data-value'?: string;
  color?: string;
}> = React.memo(({ 'data-value': dataValue, color = 'currentColor' }) => {
  return (
    <svg
      {...(dataValue ? { 'data-value': dataValue } : {})}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none">
      <title>Stars Icon</title>
      <path
        d="M4.20288 9.07812L4.96021 10.9768L6.85887 11.7341L4.96021 12.4808L4.20288 14.3901L3.45621 12.4808L1.54688 11.7341L3.45621 10.9768L4.20288 9.07812Z"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.96378 1.54688L11.2118 4.72554L14.3904 5.97354L11.2118 7.23221L9.96378 10.4002L8.70511 7.23221L5.53711 5.97354L8.70511 4.72554L9.96378 1.54688Z"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});
StarsIcon.displayName = 'StarsIcon';
