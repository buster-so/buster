import type { iconProps } from './iconProps';

function purse(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px purse';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14,7.25l1.178,4.188c.538,1.914-.9,3.812-2.888,3.812H5.71c-1.988,0-3.426-1.899-2.888-3.812l1.178-4.188"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75,5c1.853-.223,3.95-.375,6.25-.375s4.397,.152,6.25,.375"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="7.5" cy="2" fill="currentColor" r="1" />
        <circle cx="10.5" cy="2" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default purse;
