import type { iconProps } from './iconProps';

function flower(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flower';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="currentColor"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m16.25,9c0-.836-1.196-1.546-2.867-1.816.991-1.372,1.334-2.72.743-3.311-.591-.591-1.939-.247-3.311.743-.27-1.671-.98-2.867-1.816-2.867s-1.546,1.196-1.816,2.867c-1.372-.991-2.72-1.334-3.311-.743-.591.591-.247,1.939.743,3.311-1.671.27-2.867.98-2.867,1.816s1.196,1.546,2.867,1.816c-.991,1.372-1.334,2.72-.743,3.311s1.939.247,3.311-.743c.27,1.671.98,2.867,1.816,2.867s1.546-1.196,1.816-2.867c1.372.991,2.72,1.334,3.311.743s.247-1.939-.743-3.311c1.671-.27,2.867-.98,2.867-1.816Z"
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

export default flower;
