import type React from 'react';

export const PurpleDashboards: React.FC<{
  onClick?: () => void;
  style?: React.CSSProperties;
  size?: number;
  className?: string;
}> = (props) => {
  return (
    <svg
      {...props}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <mask
        id="mask0_162_4043"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="24"
        height="24"></mask>
      <g>
        <path
          d="M5 20.5C4.58366 20.5 4.2397 20.3576 3.94105 20.0589C3.64241 19.7603 3.5 19.4163 3.5 19V13.25H9.5V20.5H5ZM12.5 20.5V13.25H20.5V19C20.5 19.4163 20.3576 19.7603 20.0589 20.0589C19.7603 20.3576 19.4163 20.5 19 20.5H12.5ZM3.5 10.25V5C3.5 4.58366 3.64241 4.2397 3.94105 3.94105C4.2397 3.64241 4.58366 3.5 5 3.5H19C19.4163 3.5 19.7603 3.64241 20.0589 3.94105C20.3576 4.2397 20.5 4.58366 20.5 5V10.25H3.5Z"
          fill="#9747FF"
          fillOpacity="0.19"
          stroke="#7C3AED"
        />
      </g>
    </svg>
  );
};
