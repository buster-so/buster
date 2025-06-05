import type { iconProps } from './iconProps';

function findReplace(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px find replace';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.25 13.5L2.75 11.75 1.25 13.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25,16.25h-1c-1.381,0-2.5-1.119-2.5-2.5v-1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75 4.5L15.25 6.25 16.75 4.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75,1.75h1c1.381,0,2.5,1.119,2.5,2.5v1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.694,6.306c.026-.183,.056-.366,.056-.556,0-2.209-1.791-4-4-4S1.75,3.541,1.75,5.75s1.791,4,4,4c.191,0,.373-.03,.556-.056"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="7.5"
          width="7.5"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="8.75"
          y="8.75"
        />
      </g>
    </svg>
  );
}

export default findReplace;
