import type { iconProps } from './iconProps';

function folderBolt(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px folder bolt';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.25,8.75V4.75c0-1.105,.895-2,2-2h1.951c.607,0,1.18,.275,1.56,.748l.603,.752h5.386c1.105,0,2,.895,2,2v2.117"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.711,8.367c-.179-.921-.988-1.617-1.961-1.617H4.25c-1.105,0-2,.896-2,2v4.5c0,1.104,.895,2,2,2h6.23"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.417 14.25L12.75 14.25 15 10.75 14.083 13.75 16.75 13.75 14.5 17.25 15.417 14.25z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default folderBolt;
