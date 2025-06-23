import type { iconProps } from './iconProps';

function arrowTurnLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow turn left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m1.25,6.25h7.5c1.105,0,2-.895,2-2v-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25 3L1 6.25 4.25 9.5"
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

export default arrowTurnLeft;
