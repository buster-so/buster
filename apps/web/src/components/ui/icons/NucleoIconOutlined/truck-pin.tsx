import type { iconProps } from './iconProps';

function truckPin(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px truck pin';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="4.5"
          cy="14"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="12.25"
          cy="14"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="3.5" cy="3.5" fill="currentColor" r=".75" />
        <path
          d="M10.519 13.75L6.25 13.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.696,2.75h1.554c1.105,0,2,.895,2,2v7.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.768,13.75h-.018c-1.105,0-2-.895-2-2v-3.408"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25,5.75h2.204c.34,0,.657,.173,.841,.459l1.796,2.794c.104,.161,.159,.349,.159,.541v2.206c0,1.105-.895,2-2,2h-1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25 9.25L17.153 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.5,7.25S.75,5.741,.75,3.5C.75,1.981,1.981,.75,3.5,.75s2.75,1.231,2.75,2.75c0,2.241-2.75,3.75-2.75,3.75Z"
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

export default truckPin;
