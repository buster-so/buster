import type { iconProps } from './iconProps';

function quickSearch(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px quick search';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.25 15.25L11.285 11.285"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m5.1564,3.4944c-1.4377.8782-2.4064,2.4475-2.4064,4.2556,0,2.7615,2.2386,5,5,5s5-2.2385,5-5c0-.3254-.0364-.6418-.0958-.95"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.6667 5.25L7 5.25 9.25 1.75 8.3333 4.75 11 4.75 8.75 8.25 9.6667 5.25z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default quickSearch;
