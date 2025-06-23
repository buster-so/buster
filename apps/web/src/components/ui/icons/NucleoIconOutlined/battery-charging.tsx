import type { iconProps } from './iconProps';

function batteryCharging(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px battery charging';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.25,13.75h-1.5c-1.105,0-2-.895-2-2V6.25c0-1.105,.895-2,2-2h3.046"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,4.25h1c1.105,0,2,.895,2,2v5.5c0,1.105-.895,2-2,2h-2.546"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75 7.75H17.25V10.25H15.75z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75,14.25l4-5.5h-3l1.5-5-4,5.5h3l-1.5,5Z"
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

export default batteryCharging;
