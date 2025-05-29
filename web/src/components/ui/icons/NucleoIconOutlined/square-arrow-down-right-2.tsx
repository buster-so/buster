import type { iconProps } from './iconProps';

function squareArrowDownRight2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square arrow down right 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11,11L5.311,5.311c-.945-.945-.276-2.561,1.061-2.561h6.879c1.105,0,2,.895,2,2V13.25c0,1.105-.895,2-2,2H4.75c-1.105,0-2-.895-2-2V6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 6.75L11.25 11.25 6.75 11.25"
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

export default squareArrowDownRight2;
