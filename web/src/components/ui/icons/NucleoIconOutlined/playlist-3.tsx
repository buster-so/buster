import type { iconProps } from './iconProps';

function playlist3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px playlist 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m10.7098,8.4835l-2.2964-1.3853c-.402-.2425-.9148.047-.9148.5165v2.7706c0,.4695.5128.759.9148.5165l2.2964-1.3853c.3888-.2346.3888-.7984,0-1.033Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="M16.25 4.25L16.25 13.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 4.25L1.75 13.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="8.5"
          width="12.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(90 9 9)"
          x="2.75"
          y="4.75"
        />
      </g>
    </svg>
  );
}

export default playlist3;
