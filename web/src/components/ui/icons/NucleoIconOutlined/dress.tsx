import type { iconProps } from './iconProps';

function dress(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dress';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.75 2.75L12.75 1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.5 7.75L11.5 7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25 2.75L5.25 1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,16.25c2.417,0,4.03-.257,5.75-.578,0-5.219-3.25-7.922-3.25-7.922,0,0,1.25-2.342,1.25-5-2.61,0-3.75,1.5-3.75,1.5,0,0-1.14-1.5-3.75-1.5,0,2.658,1.25,5,1.25,5,0,0-3.25,2.703-3.25,7.922,1.72,.321,3.333,.578,5.75,.578Z"
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

export default dress;
