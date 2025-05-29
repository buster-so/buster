import type { iconProps } from './iconProps';

function connections(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px connections';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.625 5.375L9 9 5.375 12.625"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.625 12.625L9 9 5.375 5.375"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.625 5.375L9 1.75 5.375 5.375 1.75 9 5.375 12.625 9 16.25 12.625 12.625 16.25 9 12.625 5.375z"
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

export default connections;
