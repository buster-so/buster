import type { iconProps } from './iconProps';

function align2Vertical(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px align 2 vertical';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.25 6L11.25 6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M0.75 6L3.75 6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="7.5"
          width="4.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 6 6)"
          x="3.75"
          y="2.25"
        />
      </g>
    </svg>
  );
}

export default align2Vertical;
