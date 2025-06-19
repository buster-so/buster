import type { iconProps } from './iconProps';

function movieReel(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px movie reel';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="9" cy="5.5" fill="currentColor" r="1.5" />
        <circle cx="12.5" cy="9" fill="currentColor" r="1.5" />
        <circle cx="9" cy="12.5" fill="currentColor" r="1.5" />
        <circle cx="5.5" cy="9" fill="currentColor" r="1.5" />
        <path
          d="M9 16.25L16.25 16.25"
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

export default movieReel;
