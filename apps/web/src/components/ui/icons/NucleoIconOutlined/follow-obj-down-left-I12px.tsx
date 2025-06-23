import type { iconProps } from './iconProps';

function followObjDownLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px follow obj down left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.982 1.018L6.927 5.073"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75 1.5L6.75 5.25 10.5 5.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="4.5"
          width="4.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-90 3 9)"
          x=".75"
          y="6.75"
        />
      </g>
    </svg>
  );
}

export default followObjDownLeft;
