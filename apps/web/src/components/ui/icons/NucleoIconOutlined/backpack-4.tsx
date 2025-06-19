import type { iconProps } from './iconProps';

function backpack4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px backpack 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.75 10.75L12.25 10.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.75 10.75L9.75 12.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.339,4.812l-.293-3.521c-.024-.292,.206-.542,.498-.542h1.747c.26,0,.477,.199,.498,.458l.146,1.757"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.661,4.812l.293-3.521c.024-.292-.206-.542-.498-.542h-1.747c-.26,0-.477,.199-.498,.458l-.146,1.757"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,2.75h0c3.176,0,5.75,2.574,5.75,5.75v5.75c0,1.105-.895,2-2,2H5.25c-1.105,0-2-.895-2-2v-5.75c0-3.176,2.574-5.75,5.75-5.75Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75,16.25v-6.25c0-1.795,1.455-3.25,3.25-3.25h0c1.795,0,3.25,1.455,3.25,3.25v6.25"
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

export default backpack4;
