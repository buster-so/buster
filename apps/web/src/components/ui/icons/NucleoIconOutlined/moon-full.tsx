import type { iconProps } from './iconProps';

function moonFull(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px moon full';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="9.75" cy="11.75" fill="currentColor" r=".75" />
        <circle cx="6.5" cy="9" fill="currentColor" r="1" />
        <circle cx="10.75" cy="6.75" fill="currentColor" r="1.25" />
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
      </g>
    </svg>
  );
}

export default moonFull;
