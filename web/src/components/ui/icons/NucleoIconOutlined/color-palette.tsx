import type { iconProps } from './iconProps';

function colorPalette(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px color palette';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.25,4.25v-.5c0-.552-.448-1-1-1H3.75c-.552,0-1,.448-1,1V13"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.932,8.25l.2-.2c.391-.391,.391-1.024,0-1.414l-1.768-1.768c-.391-.391-1.024-.391-1.414,0L3.409,11.409"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,6.75h0c1.242,0,2.25,1.008,2.25,2.25v9.25c0,.552-.448,1-1,1h-2.5c-.552,0-1-.448-1-1V9c0-1.242,1.008-2.25,2.25-2.25Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-90 9 13)"
        />
        <path
          d="M8.25 10.75L8.25 15.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75 10.75L11.75 15.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="5" cy="13" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default colorPalette;
