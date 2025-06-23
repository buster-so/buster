import type { iconProps } from './iconProps';

function keyboardHideDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px keyboard hide down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="8.5"
          width="16.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x=".75"
          y="2.75"
        />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="3" y="5" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="3" y="7.5" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="5.5" y="5" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="8.25" y="5" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="13.5" y="5" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="13.5" y="7.5" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="11" y="5" />
        <path
          d="M11.75 8.25L6.25 8.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.5 13.75L9 16.25 6.5 13.75"
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

export default keyboardHideDown;
