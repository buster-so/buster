import type { iconProps } from './iconProps';

function sofa(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sofa';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75,6.75v-2c0-1.105,.895-2,2-2H13.25c1.105,0,2,.895,2,2v2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 2.75L9 10.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,13.25h5.75c1.105,0,2-.895,2-2v-3c0-.828-.672-1.5-1.5-1.5h0c-.828,0-1.5,.672-1.5,1.5v2s-4.75,0-4.75,0H4.25v-2c0-.828-.672-1.5-1.5-1.5h0c-.828,0-1.5,.672-1.5,1.5v3c0,1.105,.895,2,2,2h5.75Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.25 13.25L3.25 15.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75 13.25L14.75 15.25"
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

export default sofa;
