import type { iconProps } from './iconProps';

function arrowBoldDownToLine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow bold down to line';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.574,7.543l4.021,5.555c.2,.276,.61,.276,.81,0l4.021-5.555c.239-.331,.003-.793-.405-.793h-2.271V2.75c0-.552-.448-1-1-1h-1.5c-.552,0-1,.448-1,1V6.75h-2.271c-.408,0-.644,.463-.405,.793Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75 16.25L14.25 16.25"
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

export default arrowBoldDownToLine;
