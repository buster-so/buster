import type { iconProps } from './iconProps';

function squareActivityChart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square activity chart';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13,9h-1.5l-1.25,3.25-2.5-6.5-1.25,3.25h-1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="12.5"
          width="12.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="2.75"
        />
      </g>
    </svg>
  );
}

export default squareActivityChart;
