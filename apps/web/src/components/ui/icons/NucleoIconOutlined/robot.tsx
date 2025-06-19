import type { iconProps } from './iconProps';

function robot(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px robot';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="2.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="11" fill="currentColor" r="1" strokeWidth="0" />
        <circle cx="12" cy="11" fill="currentColor" r="1" strokeWidth="0" />
        <path
          d="M9 3.75L9 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m8,12h2c.276,0,.5.224.5.5h0c0,.828-.672,1.5-1.5,1.5h0c-.828,0-1.5-.672-1.5-1.5h0c0-.276.224-.5.5-.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m15.25,14.25c0,1.1046-.8954,2-2,2H4.75c-1.1046,0-2-.8954-2-2v-5.5c0-1.1046.8954-2,2-2h8.5c1.1046,0,2,.8954,2,2v5.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75 11.75L1 11.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25 11.75L17 11.75"
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

export default robot;
