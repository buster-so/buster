import type { iconProps } from './iconProps';

function location3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px location 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.429,5.978c0,2.609-4.429,7.272-4.429,7.272,0,0-4.429-4.662-4.429-7.272,0-2.675,2.289-4.228,4.429-4.228s4.429,1.552,4.429,4.228Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25 16.25L2.75 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="6"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default location3;
