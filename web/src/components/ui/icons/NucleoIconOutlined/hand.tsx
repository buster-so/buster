import type { iconProps } from './iconProps';

function hand(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hand';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.75,8.25V2.5c0-.69-.564-1.25-1.25-1.25s-1.25,.56-1.25,1.25v5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25,8.25V3.25c0-.69-.564-1.25-1.25-1.25s-1.25,.56-1.25,1.25v5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.25,8.25V3.25c0-.69-.564-1.25-1.25-1.25s-1.25,.56-1.25,1.25V12.053"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75,11.215l-1.768-2.252c-.426-.543-1.215-.635-1.755-.211s-.604,1.131-.211,1.755l2.551,3.924c.738,1.135,2,1.82,3.354,1.82h3.83c2.209,0,4-1.791,4-4V4c0-.69-.564-1.25-1.25-1.25s-1.25,.56-1.25,1.25v4.25"
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

export default hand;
