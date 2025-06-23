import type { iconProps } from './iconProps';

function moveObjLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px move obj left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.5 12.25L2.25 9 5.5 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.25 9L9.75 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="3"
          width="12.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-90 14.25 9)"
          x="8"
          y="7.5"
        />
      </g>
    </svg>
  );
}

export default moveObjLeft;
