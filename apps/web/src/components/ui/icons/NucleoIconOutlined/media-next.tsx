import type { iconProps } from './iconProps';

function mediaNext(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px media next';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.05,3.677l8.254,4.57c.595,.33,.595,1.177,0,1.506L4.05,14.323c-.582,.322-1.3-.094-1.3-.753V4.43c0-.66,.718-1.075,1.3-.753Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25 15.25L15.25 2.75"
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

export default mediaNext;
