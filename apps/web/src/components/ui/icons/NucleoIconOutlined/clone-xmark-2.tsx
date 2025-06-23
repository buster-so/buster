import type { iconProps } from './iconProps';

function cloneXmark2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px clone xmark 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="11"
          width="11"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="5.25"
          y="5.25"
        />
        <path
          d="m3,12.605c-.733-.297-1.25-1.015-1.25-1.855V3.75c0-1.105.895-2,2-2h7c.839,0,1.558.517,1.855,1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75 12.75L8.75 8.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 12.75L12.75 8.75"
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

export default cloneXmark2;
