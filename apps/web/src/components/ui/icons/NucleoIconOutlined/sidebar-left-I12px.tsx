import type { iconProps } from './iconProps';

function sidebarLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px sidebar left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.75 1.75L4.75 10.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
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
      </g>
    </svg>
  );
}

export default sidebarLeft;
