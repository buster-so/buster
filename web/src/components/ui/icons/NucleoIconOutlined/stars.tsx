import type { iconProps } from './iconProps';

function stars(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px stars';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.741 7.308L16.25 5.837 12.363 5.272 10.625 1.75 9.47 4.09"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.375 5.495L9.113 9.017 13 9.582 10.187 12.323 10.851 16.194 7.375 14.366 3.899 16.194 4.563 12.323 1.75 9.582 5.637 9.017 7.375 5.495z"
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

export default stars;
