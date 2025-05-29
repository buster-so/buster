import type { iconProps } from './iconProps';

function backpack(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px backpack';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75,15.25h-1c-.828,0-1.5-.672-1.5-1.5v-3c0-.552,.448-1,1-1h1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25,15.25h1c.828,0,1.5-.672,1.5-1.5v-3c0-.552-.448-1-1-1h-1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25 11.75L11.75 11.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75,3.75v-.75c0-1.243,1.007-2.25,2.25-2.25h0c1.243,0,2.25,1.007,2.25,2.25v.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75,3.75h2.5c2.209,0,4,1.791,4,4v6.5c0,1.105-.895,2-2,2H5.75c-1.105,0-2-.895-2-2V7.75c0-2.209,1.791-4,4-4Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25,16.25v-5.5c0-1.105,.895-2,2-2h1.5c1.105,0,2,.895,2,2v5.5"
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

export default backpack;
