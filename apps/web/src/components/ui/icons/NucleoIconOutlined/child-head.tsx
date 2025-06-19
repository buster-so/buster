import type { iconProps } from './iconProps';

function childHead(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px child head';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.416,5.662c-.362,.363-.863,.588-1.416,.588-1.105,0-2-.895-2-2s.895-2,2-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17.25,9c0-.962-.777-1.741-1.737-1.749-.771-2.879-3.391-5.001-6.513-5.001S3.258,4.373,2.487,7.251c-.96,.007-1.737,.787-1.737,1.749s.777,1.741,1.737,1.749c.771,2.879,3.391,5.001,6.513,5.001s5.742-2.123,6.513-5.001c.96-.007,1.737-.787,1.737-1.749Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.667,11h2.667c.368,0,.667,.299,.667,.667h0c0,1.104-.896,2-2,2h0c-1.104,0-2-.896-2-2h0c0-.368,.299-.667,.667-.667Z"
          fill="currentColor"
        />
        <circle cx="6" cy="9" fill="currentColor" r="1" />
        <circle cx="12" cy="9" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default childHead;
