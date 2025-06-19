import type { iconProps } from './iconProps';

function sackCoins(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sack coins';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.5,4.75l2-3c0-.552-.448-1-1-1h-2.75s-2.75,0-2.75,0c-.552,0-1,.448-1,1l2,3h3.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75 4.75L7.75 3.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.156,7.25c-.722-1.06-1.641-1.956-2.656-2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6,4.75C3.609,6.031,1.75,9.266,1.75,12c0,3.314,2.686,4.25,6,4.25,.207,0,.412-.004,.613-.011"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="3"
          width="6.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="10.75"
          y="7.25"
        />
        <rect
          height="3"
          width="6.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="9.75"
          y="10.25"
        />
        <rect
          height="3"
          width="6.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="10.75"
          y="13.25"
        />
      </g>
    </svg>
  );
}

export default sackCoins;
