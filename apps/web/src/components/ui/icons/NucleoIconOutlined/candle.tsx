import type { iconProps } from './iconProps';

function candle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px candle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.25 7.75L9.25 11.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,5.25c.967,0,1.75-.766,1.75-1.712,0-1.301-1.75-2.788-1.75-2.788,0,0-1.75,1.487-1.75,2.788,0,.946,.783,1.712,1.75,1.712Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25,15.75v-7c0-.552,.448-1,1-1h3.5c.552,0,1,.448,1,1v7"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15 15.75L3 15.75"
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

export default candle;
