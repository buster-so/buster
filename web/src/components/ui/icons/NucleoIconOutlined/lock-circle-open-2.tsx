import type { iconProps } from './iconProps';

function lockCircleOpen2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px lock circle open 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.75,7.628v-3.128c0-1.519-1.231-2.75-2.75-2.75h0c-1.519,0-2.75,1.231-2.75,2.75v1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.5 11L9.5 12"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9.5"
          cy="11.5"
          fill="none"
          r="4.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default lockCircleOpen2;
