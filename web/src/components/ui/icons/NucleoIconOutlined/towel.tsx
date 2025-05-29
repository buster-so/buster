import type { iconProps } from './iconProps';

function towel(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px towel';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.75,14.75c0,.552,.448,1,1,1H14.25c.552,0,1-.448,1-1V4.5c0-.966-.784-1.75-1.75-1.75h0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.5,2.75c-.966,0-1.75,.784-1.75,1.75v6.75c0,.552-.448,1-1,1H3.75c-.552,0-1-.448-1-1V4.5c0-.966,.784-1.75,1.75-1.75H13.5Z"
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

export default towel;
