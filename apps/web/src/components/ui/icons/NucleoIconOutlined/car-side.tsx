import type { iconProps } from './iconProps';

function carSide(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px car side';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.75 13.25L11.77 13.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25 3.75L7.25 8.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.25,13.25h-.5c-.552,0-1-.448-1-1v-3.528c0-.31,.072-.617,.211-.894l1.486-2.972c.339-.678,1.031-1.106,1.789-1.106h2.014s1.75,0,1.75,0h2.264c.758,0,1.45,.428,1.789,1.106l1.697,3.394h1.5c1.105,0,2,.895,2,2v2c0,.552-.448,1-1,1h-1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.583 8.25L1 8.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="4"
          cy="13.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="13.5"
          cy="13.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default carSide;
