import type { iconProps } from './iconProps';

function followObjUpRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px follow obj up right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.018 10.982L5.073 6.927"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25 10.5L5.25 6.75 1.5 6.75"
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
          transform="rotate(90 9 3)"
          x="6.75"
          y=".75"
        />
      </g>
    </svg>
  );
}

export default followObjUpRight;
