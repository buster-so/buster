import type { iconProps } from './iconProps';

function greaterThan(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px greater than';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75 2.75L14.25 9 3.75 15.25"
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

export default greaterThan;
