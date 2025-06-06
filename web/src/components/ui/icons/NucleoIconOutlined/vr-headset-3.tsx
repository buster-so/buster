import type { iconProps } from './iconProps';

function vrHeadset3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px vr headset 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75,5.75H14.25c1.105,0,2,.895,2,2v4.5c0,1.105-.895,2-2,2h-2c-.63,0-1.222-.296-1.6-.8l-.45-.6c-.6-.8-1.8-.8-2.4,0l-.45,.6c-.378,.504-.97,.8-1.6,.8H3.75c-1.105,0-2-.895-2-2V7.75c0-1.105,.895-2,2-2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.979,6.745l-1.892-3.049c-.365-.588-1.008-.946-1.699-.946h-3.387s-3.387,0-3.387,0c-.692,0-1.335,.358-1.699,.946l-1.892,3.049"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="5.5"
          cy="10"
          fill="currentColor"
          r=".75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="12.5"
          cy="10"
          fill="currentColor"
          r=".75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default vrHeadset3;
