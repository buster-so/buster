import type { iconProps } from './iconProps';

function cropAlphaGrid(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px crop alpha grid';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path d="M6 6H7.5V7.5H6z" fill="currentColor" />
        <path d="M9 6H10.5V7.5H9z" fill="currentColor" />
        <path d="M10.5 7.5H12V9H10.5z" fill="currentColor" />
        <path d="M7.5 7.5H9V9H7.5z" fill="currentColor" />
        <path d="M6 9H7.5V10.5H6z" fill="currentColor" />
        <path d="M9 9H10.5V10.5H9z" fill="currentColor" />
        <path d="M10.5 10.5H12V12H10.5z" fill="currentColor" />
        <path d="M7.5 10.5H9V12H7.5z" fill="currentColor" />
        <path
          d="M6.75,4.25h6c.552,0,1,.448,1,1v11"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 4.25L4.25 4.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,13.75H5.25c-.552,0-1-.448-1-1V1.75"
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

export default cropAlphaGrid;
