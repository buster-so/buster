import type { iconProps } from './iconProps';

function clone2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px clone 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m3.667,8.25h-1.417c-.828,0-1.5-.672-1.5-1.5V2.25c0-.828.672-1.5,1.5-1.5h4.5c.828,0,1.5.672,1.5,1.5v1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="7.5"
          width="7.5"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 7.5 7.5)"
          x="3.75"
          y="3.75"
        />
      </g>
    </svg>
  );
}

export default clone2;
