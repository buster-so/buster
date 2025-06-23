import type { iconProps } from './iconProps';

function heartSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heart slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m14.463,3.537c-.639-.483-1.426-.782-2.289-.787-1.277.016-2.464.66-3.173,1.72-.71-1.061-1.896-1.704-3.173-1.72-2.123.013-3.834,1.739-3.827,3.859,0,2.67,1.518,4.768,3.14,6.251"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m7.136,14.399c.563.368,1.058.647,1.394.822.297.155.644.155.941,0,1.57-.819,6.529-3.787,6.529-8.613.001-.328-.051-.641-.128-.946"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 16L16 2"
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

export default heartSlash;
