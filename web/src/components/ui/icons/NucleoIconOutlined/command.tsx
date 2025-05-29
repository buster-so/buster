import type { iconProps } from './iconProps';

function command(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px command';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.75 6.75H11.25V11.25H6.75z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75,2.75h0c1.104,0,2,.896,2,2v2h-2c-1.104,0-2-.896-2-2h0c0-1.104,.896-2,2-2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25,2.75h0c1.104,0,2,.896,2,2v2h-2c-1.104,0-2-.896-2-2h0c0-1.104,.896-2,2-2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(90 13.25 4.75)"
        />
        <path
          d="M13.25,11.25h0c1.104,0,2,.896,2,2v2h-2c-1.104,0-2-.896-2-2h0c0-1.104,.896-2,2-2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-180 13.25 13.25)"
        />
        <path
          d="M4.75,11.25h0c1.104,0,2,.896,2,2v2h-2c-1.104,0-2-.896-2-2h0c0-1.104,.896-2,2-2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-90 4.75 13.25)"
        />
      </g>
    </svg>
  );
}

export default command;
