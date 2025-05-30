import type React from 'react';

export const AthenaIcon: React.FC<{
  onClick?: () => void;
  style?: React.CSSProperties;
  size?: number;
  className?: string;
}> = (props) => {
  return (
    <>
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 85 85"
        fill="red"
        fillRule="evenodd"
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
        width={props.size || 24}
        height={props.size || 24}>
        <title>Athena Icon</title>
        <use x="2.5" y="2.5" />
        <g stroke="none">
          <path d="M80 48.357l-40-4.981-40 4.981L40 80l40-31.643z" fill="#fcbf92" />
          <path d="M0 48.357l40 12.089V80L0 59.733V48.357z" fill="#9d5025" />
          <path d="M80 48.357L40 60.446V80l40-20.267V48.357z" fill="#f58534" />
          <path d="M5.165 31.168H0v11.495l5.165.951 5.741-6.157-5.741-6.288z" fill="#9d5025" />
          <path d="M10.906 43.138l-5.741.475V31.168h5.741v11.97z" fill="#f58534" />
          <path
            d="M14.777 16.832l-6.8 1.296v26.08l6.8 1.426 6.224-14.467-6.224-14.336z"
            fill="#9d5025"
          />
          <path d="M21 44.921l-6.223.713V16.832l6.223.713v27.376z" fill="#f58534" />
          <path
            d="M28.035 22.633l-9.388.951v22.871l9.388 1.902L38 35.435l-9.965-12.802z"
            fill="#9d5025"
          />
          <path d="M34.364 47.287l-6.329 1.07V22.633l6.329.475v24.178z" fill="#f58534" />
          <g fill="#9d5025">
            <path d="M40 1.89l-6.329 2.021v45.516L40 50.722l6.329-24.416L40 1.89z" />
            <path d="M45.859 47.287l6.106 1.07 9.388-17.189-9.388-17.07-6.106.951v32.238z" />
            <path d="M61.353 31.168l-9.388-17.07-6.106.951" />
            <path d="M58.882 44.922l6.341.713 6.8-21.694-6.8-21.575-6.341 1.545v41.01z" />
            <path d="M69.094 43.138l5.741.475L80 22.158 74.835 0l-5.741 1.426v41.712z" />
          </g>
          <path
            d="M40 1.89l6.329 2.021v45.516L40 50.722V1.89zM61.353 16l-9.388-1.902v34.259l9.388-1.902V16zM72.024 5.1l-6.8-2.734v43.269l6.8-1.427V5.1zM80 2.603L74.835 0v43.614L80 42.663V2.603z"
            fill="#f58534"
          />
        </g>
      </svg>
    </>
  );
};
