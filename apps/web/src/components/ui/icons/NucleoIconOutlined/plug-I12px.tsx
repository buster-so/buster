import type { iconProps } from './iconProps';

function plug(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px plug';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6 9.25L6 11.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75 0.75L3.75 2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.25 0.75L8.25 2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m2.75,2.75h6.5c.552,0,1,.448,1,1v1.25c0,2.346-1.904,4.25-4.25,4.25h0c-2.346,0-4.25-1.904-4.25-4.25v-1.25c0-.552.448-1,1-1Z"
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

export default plug;
