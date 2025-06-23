import type { iconProps } from './iconProps';

function layoutBottom(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px layout bottom';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="12.5"
          width="14.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 9 9)"
          x="1.75"
          y="2.75"
        />
        <path
          d="M4.75 12.25L13.25 12.25"
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

export default layoutBottom;
