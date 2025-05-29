import type { iconProps } from './iconProps';

function faceSurprise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face surprise';

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
        <circle
          cx="9"
          cy="11.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="8" fill="currentColor" r="1" />
        <circle cx="12" cy="8" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default faceSurprise;
