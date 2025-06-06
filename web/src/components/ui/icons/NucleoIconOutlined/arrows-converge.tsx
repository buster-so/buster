import type { iconProps } from './iconProps';

function arrowsConverge(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrows converge';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.508,13.75H3.75c-1.105,0-2-.895-2-2V6.25c0-1.105,.895-2,2-2H14.25c1.105,0,2,.895,2,2v5.5c0,1.105-.895,2-2,2h-3.742"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75 11.5L10.508 13.742 12.75 15.985"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.265 11.5L7.508 13.742 5.265 15.985"
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

export default arrowsConverge;
