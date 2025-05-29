import type { iconProps } from './iconProps';

function microphone(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px microphone';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m10.75,5c0,2.619-2.131,4.75-4.75,4.75S1.25,7.619,1.25,5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6 9.75L6 11.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="6.5"
          width="4.5"
          fill="none"
          rx="2.25"
          ry="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="3.75"
          y=".75"
        />
      </g>
    </svg>
  );
}

export default microphone;
