import type { iconProps } from './iconProps';

function gymBag(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gym bag';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.75,15.25V5c0-1.795,1.455-3.25,3.25-3.25h0c1.795,0,3.25,1.455,3.25,3.25V15.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.607,15.25c.413,0,.782-.248,.932-.633,.33-.847,.71-2.236,.71-3.617,0-.587-.069-2.18-.691-3.629-.16-.373-.524-.621-.93-.621H3.371c-.406,0-.77,.248-.93,.621-.623,1.449-.691,3.042-.691,3.629,0,1.382,.38,2.77,.71,3.617,.15,.385,.519,.633,.932,.633H14.607Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.25 9.25L9.75 9.25"
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

export default gymBag;
