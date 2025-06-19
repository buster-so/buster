import type { iconProps } from './iconProps';

function objSizeIncreaseX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px obj size increase x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="4.5"
          width="14.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-90 9 9)"
          x="1.75"
          y="6.75"
        />
        <path
          d="M14.25 6.75L16.5 9 14.25 11.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75 6.75L1.5 9 3.75 11.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default objSizeIncreaseX;
