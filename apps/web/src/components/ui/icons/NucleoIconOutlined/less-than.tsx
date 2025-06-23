import type { iconProps } from './iconProps';

function lessThan(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px less than';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.25 2.75L3.75 9 14.25 15.25"
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

export default lessThan;
