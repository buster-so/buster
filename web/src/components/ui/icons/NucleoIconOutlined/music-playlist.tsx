import type { iconProps } from './iconProps';

function musicPlaylist(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px music playlist';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8,16.182c-3.531-.487-6.25-3.517-6.25-7.182C1.75,4.996,4.996,1.75,9,1.75s7.25,3.246,7.25,7.25c0,.339-.023,.673-.068,1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75 16.25L16.25 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75 12.75L16.25 12.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.25,10.25V4.75c.317,.323,.73,.692,1.25,1.047,.45,.307,.879,.535,1.25,.703"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="7.75"
          cy="10.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default musicPlaylist;
