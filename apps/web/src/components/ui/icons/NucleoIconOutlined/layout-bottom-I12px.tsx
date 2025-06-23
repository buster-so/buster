import type { iconProps } from './iconProps';

function layoutBottom(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px layout bottom';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="8.5"
          width="10.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x=".75"
          y="1.75"
        />
        <path
          d="M3.25 7.75L8.75 7.75"
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

export default layoutBottom;
