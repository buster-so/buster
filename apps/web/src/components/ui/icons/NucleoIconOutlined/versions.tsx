import type { iconProps } from './iconProps';

function versions(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px versions';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.813,12.75h-1.063c-1.105,0-2-.895-2-2v-3.5c0-1.105,.895-2,2-2h1.064"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.314,14.25h-1.564c-1.105,0-2-.895-2-2V5.75c0-1.105,.895-2,2-2h1.564"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="13.5"
          width="7.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 12 9)"
          x="8.25"
          y="2.25"
        />
      </g>
    </svg>
  );
}

export default versions;
