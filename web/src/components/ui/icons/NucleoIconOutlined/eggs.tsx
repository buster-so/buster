import type { iconProps } from './iconProps';

function eggs(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px eggs';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.75,11.375C1.75,8.125,3.877,3.25,6.5,3.25s4.75,4.875,4.75,8.125c.034,2.658-2.092,4.84-4.75,4.875-2.658-.035-4.784-2.217-4.75-4.875Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.456,2.353c.437-.352,.975-.565,1.544-.603,2.347,0,4.25,4.312,4.25,7.188,.007,1.607-.877,3.059-2.252,3.805"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="6.5"
          cy="11.5"
          fill="none"
          r="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default eggs;
