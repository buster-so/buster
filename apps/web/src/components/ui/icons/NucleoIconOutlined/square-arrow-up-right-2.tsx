import type { iconProps } from './iconProps';

function squareArrowUpRight2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square arrow up right 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11,7l-5.689,5.689c-.945,.945-2.561,.276-2.561-1.061V4.75c0-1.105,.895-2,2-2H13.25c1.105,0,2,.895,2,2V13.25c0,1.105-.895,2-2,2H6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75 6.75L11.25 6.75 11.25 11.25"
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

export default squareArrowUpRight2;
