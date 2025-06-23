import type { iconProps } from './iconProps';

function foodDeliveryTime(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px food delivery time';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.25,16.25V6.75c-.335,.611-.7,1.396-.991,2.344-.312,1.016-.45,1.928-.509,2.656l1.5,1.508"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75,12.155c-2.421-.467-4.25-2.597-4.25-5.155C1.5,4.101,3.851,1.75,6.75,1.75c1.917,0,3.595,1.028,4.511,2.563"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75 4L6.75 7 4.25 8.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75 6.75L14.75 8.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.75,6.75l.125,2.253c.068,1.22-.903,2.247-2.125,2.247h0c-1.222,0-2.193-1.026-2.125-2.247l.125-2.253"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75 11.25L14.75 16.25"
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

export default foodDeliveryTime;
