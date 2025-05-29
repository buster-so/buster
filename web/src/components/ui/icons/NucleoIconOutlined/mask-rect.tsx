import type { iconProps } from './iconProps';

function maskRect(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px mask rect';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.25,12.25H2.75c-.552,0-1-.448-1-1V6.75c0-.552,.448-1,1-1h2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75,5.75h3.5c.552,0,1,.448,1,1v4.5c0,.552-.448,1-1,1h-3.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="14.5"
          width="8"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="7.75"
          y="1.75"
        />
      </g>
    </svg>
  );
}

export default maskRect;
