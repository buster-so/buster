import type { iconProps } from './iconProps';

function layersStacked(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px layers stacked';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.25 7.75L16.25 7.75 13.75 10.25 1.75 10.25 4.25 7.75z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25 2.75L16.25 2.75 13.75 5.25 1.75 5.25 4.25 2.75z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25 12.75L16.25 12.75 13.75 15.25 1.75 15.25 4.25 12.75z"
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

export default layersStacked;
