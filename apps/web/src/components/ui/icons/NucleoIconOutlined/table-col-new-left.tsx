import type { iconProps } from './iconProps';

function tableColNewLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table col new left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.25 2.75L9.25 15.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M0.75 9L5.75 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.137,13.963c.288,.751,1.01,1.287,1.863,1.287H13.25c1.104,0,2-.895,2-2V4.75c0-1.105-.896-2-2-2H5c-.853,0-1.575,.535-1.863,1.287"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.25 6.5L3.25 11.5"
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

export default tableColNewLeft;
