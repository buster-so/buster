import type { iconProps } from './iconProps';

function fileArrowIn(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px file arrow in';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m15.16,6.25h-3.41c-.552,0-1-.448-1-1V1.852"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75 7.25L9.25 9.75 6.75 12.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m3.75,12.25v2c0,1.1045.8954,2,2,2h7.4377c1.0937,0,1.9846-.8784,1.9998-1.9722l.0625-7.6135c0-.2654-.1054-.5198-.293-.7073l-3.9142-3.9143c-.1874-.1875-.4417-.2927-.7067-.2927h-4.586c-1.1046,0-2,.8955-2,2v3.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 9.75L0.75 9.75"
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

export default fileArrowIn;
