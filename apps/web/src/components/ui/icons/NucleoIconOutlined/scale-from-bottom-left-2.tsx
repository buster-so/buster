import type { iconProps } from './iconProps';

function scaleFromBottomLeft2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px scale from bottom left 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.75,15.25h2.5c1.105,0,2-.895,2-2V4.75c0-1.105-.895-2-2-2H4.75c-1.105,0-2,.895-2,2v2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="6"
          width="6"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-90 5.75 12.25)"
          x="2.75"
          y="9.25"
        />
      </g>
    </svg>
  );
}

export default scaleFromBottomLeft2;
