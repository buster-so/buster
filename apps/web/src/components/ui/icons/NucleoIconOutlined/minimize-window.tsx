import type { iconProps } from './iconProps';

function minimizeWindow(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px minimize window';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.75,12.25h-2c-1.105,0-2-.895-2-2V5.75c0-1.105,.895-2,2-2H12.25c1.105,0,2,.895,2,2v2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25 6.25L7.25 9.25 4.25 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25 9.25L4.25 6.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="4.5"
          width="7.5"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="8.75"
          y="10.75"
        />
      </g>
    </svg>
  );
}

export default minimizeWindow;
