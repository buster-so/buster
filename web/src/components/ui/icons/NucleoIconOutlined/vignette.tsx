import type { iconProps } from './iconProps';

function vignette(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px vignette';

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
        <ellipse
          cx="9"
          cy="9"
          fill="none"
          rx="4.75"
          ry="3.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default vignette;
