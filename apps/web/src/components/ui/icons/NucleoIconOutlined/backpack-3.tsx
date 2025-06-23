import type { iconProps } from './iconProps';

function backpack3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px backpack 3';

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
          d="M6.75,3.707V1.75c0-.552,.448-1,1-1h2.5c.552,0,1,.448,1,1v1.957"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,3.25h0c3.176,0,5.75,2.574,5.75,5.75v5.25c0,1.105-.895,2-2,2H5.25c-1.105,0-2-.895-2-2v-5.25c0-3.176,2.574-5.75,5.75-5.75Z"
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

export default backpack3;
