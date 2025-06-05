import type { iconProps } from './iconProps';

function gear4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gear 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.25 1.75L9.75 1.75 10.25 2.75 7.75 2.75 8.25 1.75z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.596 3.343L14.657 4.404 14.303 5.464 12.536 3.697 13.596 3.343z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25 8.25L16.25 9.75 15.25 10.25 15.25 7.75 16.25 8.25z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.657 13.596L13.596 14.657 12.536 14.303 14.303 12.536 14.657 13.596z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.75 16.25L8.25 16.25 7.75 15.25 10.25 15.25 9.75 16.25z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.404 14.657L3.343 13.596 3.697 12.536 5.464 14.303 4.404 14.657z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 9.75L1.75 8.25 2.75 7.75 2.75 10.25 1.75 9.75z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.343 4.404L4.404 3.343 5.464 3.697 3.697 5.464 3.343 4.404z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="6.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default gear4;
