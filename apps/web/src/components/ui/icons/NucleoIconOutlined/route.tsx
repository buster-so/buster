import type { iconProps } from './iconProps';

function route(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px route';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.75,8.25h-2.25c-1.519,0-2.75,1.231-2.75,2.75h0c0,1.519,1.231,2.75,2.75,2.75H15.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25,2.75h7.25c1.519,0,2.75,1.231,2.75,2.75h0c0,1.519-1.231,2.75-2.75,2.75h-2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.275 16.225L15.75 13.75 13.275 11.275"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="3.25" cy="2.75" fill="currentColor" r=".75" />
        <circle
          cx="9"
          cy="8.25"
          fill="none"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default route;
