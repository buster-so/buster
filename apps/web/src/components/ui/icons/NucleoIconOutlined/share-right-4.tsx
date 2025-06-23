import type { iconProps } from './iconProps';

function shareRight4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px share right 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75,10.75v2.5c0,1.105,.895,2,2,2H15.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12 2.75L15.25 6 12 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15,6h-4c-2.347,0-4.25,1.903-4.25,4.25h0"
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

export default shareRight4;
