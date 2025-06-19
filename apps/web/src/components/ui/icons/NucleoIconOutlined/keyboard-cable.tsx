import type { iconProps } from './iconProps';

function keyboardCable(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px keyboard cable';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,4.75v-.75c0-.966,.784-1.75,1.75-1.75h1.75c.793,0,1.462-.527,1.677-1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75 10.25L6.25 10.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
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
          y="4.75"
        />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="3" y="7" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="3" y="9.5" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="5.5" y="7" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="8.25" y="7" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="13.5" y="7" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="13.5" y="9.5" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="11" y="7" />
      </g>
    </svg>
  );
}

export default keyboardCable;
