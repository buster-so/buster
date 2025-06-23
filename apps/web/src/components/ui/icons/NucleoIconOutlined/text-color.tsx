import type { iconProps } from './iconProps';

function textColor(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text color';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.57 10.25L9.273 1.75 8.727 1.75 5.43 10.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.4 7.75L11.6 7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="3.5"
          width="14.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="12.75"
        />
      </g>
    </svg>
  );
}

export default textColor;
