import React from 'react';

export const GreenDatabases: React.FC<{
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
      <mask id="mask0_162_4040" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect x="0.5" y="0.5" width="23" height="23" fill="#D9D9D9" stroke="black" />
      </mask>
      <g mask="url(#mask0_162_4040)">
        <path
          d="M18.1707 9.36863C16.5014 10.1159 14.4501 10.5 12 10.5C9.54994 10.5 7.49865 10.1159 5.82928 9.36863C4.11699 8.60218 3.5 7.78401 3.5 7C3.5 6.21599 4.11699 5.39782 5.82928 4.63137C7.49865 3.88412 9.54994 3.5 12 3.5C14.4501 3.5 16.5014 3.88412 18.1707 4.63137C19.883 5.39782 20.5 6.21599 20.5 7C20.5 7.78401 19.883 8.60218 18.1707 9.36863ZM12 14C12.7147 14 13.5935 13.9262 14.631 13.7828C15.6854 13.6371 16.703 13.4011 17.6831 13.0743C18.6748 12.7438 19.5408 12.3087 20.2734 11.7637C20.3525 11.7049 20.428 11.6443 20.5 11.582V12C20.5 12.5483 20.2564 13.03 19.6766 13.4613C19.0426 13.933 18.2752 14.3229 17.3669 14.6257C16.447 14.9323 15.4896 15.1546 14.494 15.2922C13.4815 15.4322 12.652 15.5 12 15.5C11.348 15.5 10.5185 15.4322 9.50595 15.2922C8.51041 15.1546 7.55298 14.9323 6.63311 14.6257C5.72485 14.3229 4.95744 13.933 4.32343 13.4613C3.74364 13.03 3.5 12.5483 3.5 12V11.582C3.57196 11.6443 3.64751 11.7049 3.72657 11.7637C4.45922 12.3087 5.32515 12.7438 6.31689 13.0743C7.29702 13.4011 8.31459 13.6371 9.36905 13.7828C10.4065 13.9262 11.2853 14 12 14ZM12 19C12.7147 19 13.5935 18.9262 14.631 18.7828C15.6854 18.6371 16.703 18.4011 17.6831 18.0743C18.6748 17.7438 19.5408 17.3087 20.2734 16.7637C20.3525 16.7049 20.428 16.6443 20.5 16.582V17C20.5 17.5483 20.2564 18.03 19.6766 18.4613C19.0426 18.933 18.2752 19.3229 17.3669 19.6257C16.447 19.9323 15.4896 20.1546 14.494 20.2922C13.4815 20.4322 12.652 20.5 12 20.5C11.348 20.5 10.5185 20.4322 9.50595 20.2922C8.51041 20.1546 7.55298 19.9323 6.63311 19.6257C5.72485 19.3229 4.95744 18.933 4.32343 18.4613C3.74364 18.03 3.5 17.5483 3.5 17V16.582C3.57196 16.6443 3.64751 16.7049 3.72657 16.7637C4.45922 17.3087 5.32515 17.7438 6.31689 18.0743C7.29702 18.4011 8.31459 18.6371 9.36905 18.7828C10.4065 18.9262 11.2853 19 12 19Z"
          fill="#19A450"
          fillOpacity="0.36"
          stroke="#19A450"
        />
      </g>
    </svg>
  );
};