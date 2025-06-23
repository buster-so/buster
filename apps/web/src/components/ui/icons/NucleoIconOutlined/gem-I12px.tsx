import type { iconProps } from './iconProps';

function gem(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px gem';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75 4.75L8.25 4.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.026,3.808l1.606-1.733c.192-.207.46-.325.74-.325h5.257c.28,0,.548.117.74.325l1.606,1.733c.339.366.369.925.071,1.326l-4.235,5.706c-.406.547-1.216.547-1.622,0L.954,5.134c-.297-.401-.267-.961.071-1.326Z"
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

export default gem;
