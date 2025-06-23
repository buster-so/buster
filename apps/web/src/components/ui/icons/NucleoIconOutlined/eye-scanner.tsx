import type { iconProps } from './iconProps';

function eyeScanner(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px eye scanner';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.756,9.809c-.342-.488-.342-1.13,0-1.618,.772-1.102,2.475-2.941,5.244-2.941s4.472,1.839,5.244,2.941c.342,.488,.342,1.13,0,1.618-.772,1.102-2.475,2.941-5.244,2.941s-4.472-1.839-5.244-2.941Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.25,5.75v-1.5c0-1.105,.895-2,2-2h1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25,2.25h1.5c1.105,0,2,.895,2,2v1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75,12.25v1.5c0,1.105-.895,2-2,2h-1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75,15.75h-1.5c-1.105,0-2-.895-2-2v-1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="9" cy="9" fill="currentColor" r="2" />
      </g>
    </svg>
  );
}

export default eyeScanner;
