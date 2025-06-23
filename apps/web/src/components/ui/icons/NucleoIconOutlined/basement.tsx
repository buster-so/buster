import type { iconProps } from './iconProps';

function basement(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px basement';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75 12.75L15.25 12.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75 12.75L6.75 9.25 15.25 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.25 9.25L10.25 5.75 15.25 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="12.5"
          width="14.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-90 9 9)"
          x="1.75"
          y="2.75"
        />
      </g>
    </svg>
  );
}

export default basement;
