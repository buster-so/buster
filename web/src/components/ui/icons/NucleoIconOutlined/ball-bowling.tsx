import type { iconProps } from './iconProps';

function ballBowling(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ball bowling';

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
        <circle cx="5.5" cy="7" fill="currentColor" r="1" />
        <circle cx="8.5" cy="5" fill="currentColor" r="1" />
        <circle cx="8.5" cy="9" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default ballBowling;
