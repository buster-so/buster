import type { iconProps } from './iconProps';

function user(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px user';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="6"
          cy="2.491"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m9.425,10.458c.551-.255.759-.92.458-1.446-.773-1.349-2.215-2.262-3.882-2.262s-3.11.912-3.882,2.262c-.301.526-.093,1.192.458,1.446,2.283,1.056,4.566,1.056,6.849,0Z"
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

export default user;
