import type { iconProps } from './iconProps';

function scooterFront(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px scooter front';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.75,14.25h-1c-1.105,0-2-.895-2-2V7.75c0-1.105,.895-2,2-2h4.5c1.105,0,2,.895,2,2v4.5c0,1.105-.895,2-2,2h-1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7 3.25L4.25 3.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11 3.25L13.75 3.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="3.25"
          fill="none"
          r="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="6"
          width="2.5"
          fill="none"
          rx="1.25"
          ry="1.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="7.75"
          y="10.75"
        />
      </g>
    </svg>
  );
}

export default scooterFront;
