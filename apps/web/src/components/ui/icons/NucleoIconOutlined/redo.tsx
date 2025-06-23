import type { iconProps } from './iconProps';

function redo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px redo';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15,10c-.528-.461-2.7-2.251-6-2.251s-5.472,1.79-6,2.251"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.375 5.598L15 10 10.47 11.222"
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

export default redo;
