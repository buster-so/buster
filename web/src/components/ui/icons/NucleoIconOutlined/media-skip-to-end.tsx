import type { iconProps } from './iconProps';

function mediaSkipToEnd(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px media skip to end';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.5,4.946c1.446,.872,4.6,2.776,6.011,3.628,.322,.194,.318,.661-.004,.856L1.504,13.052c-.332,.2-.754-.04-.754-.429V5.377c0-.389,.418-.632,.75-.432Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.5,4.946c1.446,.872,4.6,2.776,6.011,3.628,.322,.194,.318,.661-.004,.856l-6.002,3.623c-.332,.2-.754-.04-.754-.429V5.377c0-.389,.418-.632,.75-.432Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17.25 13.75L17.25 4.25"
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

export default mediaSkipToEnd;
