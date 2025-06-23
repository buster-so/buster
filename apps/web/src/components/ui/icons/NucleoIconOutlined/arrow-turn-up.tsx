import type { iconProps } from './iconProps';

function arrowTurnUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow turn up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.25,2.75V13.25c0,1.105,.895,2,2,2h4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.5 7L8.25 2.75 4 7"
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

export default arrowTurnUp;
