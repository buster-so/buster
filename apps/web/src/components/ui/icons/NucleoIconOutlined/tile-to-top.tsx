import type { iconProps } from './iconProps';

function tileToTop(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px tile to top';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11 12.25L9 10.25 7 12.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 10.5L9 14.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75 6.25H13.25V7.75H4.75z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m11.5,14.75h2.75c1.105,0,2-.896,2-2v-7.5c0-1.104-.895-2-2-2H3.75c-1.105,0-2,.896-2,2v7.5c0,1.104.895,2,2,2h2.75"
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

export default tileToTop;
