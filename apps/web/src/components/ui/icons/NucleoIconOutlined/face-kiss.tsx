import type { iconProps } from './iconProps';

function faceKiss(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face kiss';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75,7.75c0,.69,.56,1.25,1.25,1.25s1.25-.56,1.25-1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.75,13.875c.69,0,1.25-.56,1.25-1.25s-.56-1.25-1.25-1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75,7.75c0,.69,.56,1.25,1.25,1.25s1.25-.56,1.25-1.25"
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

export default faceKiss;
