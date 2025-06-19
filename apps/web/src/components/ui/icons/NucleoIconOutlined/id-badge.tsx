import type { iconProps } from './iconProps';

function idBadge(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px id badge';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13,3.75h1.25c1.105,0,2,.895,2,2v6.5c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2V5.75c0-1.105,.895-2,2-2h1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,.75h0c.69,0,1.25,.56,1.25,1.25v3.25h-2.5V2c0-.69,.56-1.25,1.25-1.25Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75 7.75H7.75V10.75H4.75z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.5 7.75L13.25 7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.5 10.75L13.25 10.75"
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

export default idBadge;
