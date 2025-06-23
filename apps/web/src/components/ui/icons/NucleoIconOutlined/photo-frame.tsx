import type { iconProps } from './iconProps';

function photoFrame(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px photo frame';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.25,14.25V3.75c-1.105,0-2-.896-2-2H4.75c0,1.104-.895,2-2,2V14.25c1.105,0,2,.896,2,2H13.25c0-1.104,.895-2,2-2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <ellipse
          cx="9"
          cy="9"
          fill="none"
          rx="3.75"
          ry="4.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default photoFrame;
