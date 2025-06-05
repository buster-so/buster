import type { iconProps } from './iconProps';

function hours24(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hours 24';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m3.2193,11.7889c.2826-1.0053,1.2557-1.5546,2.3088-1.5386,1.0518.016,2.0409.4866,2.1035,1.5386s-1.0518,1.7586-2.2062,2.2305c-1.1544.4706-2.1115.9106-2.2062,2.2305h4.415"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25 14.75L10.25 14.75 10.25 14.4722 13.5 10.25 14 10.25 14 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17.2333 5.0843L16.1626 7.858 13.3896 6.788"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.9418,7.3422C2.8574,3.4445,6.7595,1.027,10.6579,1.9419c2.9119.6841,4.9974,3.0351,5.4848,5.8055"
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

export default hours24;
