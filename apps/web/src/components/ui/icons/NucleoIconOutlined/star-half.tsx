import type { iconProps } from './iconProps';

function starHalf(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px star half';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 1.75L11.24 6.29 16.25 7.017 12.625 10.551 13.481 15.54 9 13.185"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 13.185L9 1.75 6.76 6.29 1.75 7.017 5.375 10.551 4.519 15.54 9 13.185z"
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

export default starHalf;
