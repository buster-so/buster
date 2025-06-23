import type { iconProps } from './iconProps';

function tableRowNewTop(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table row new top';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.25 9.25L2.75 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 0.75L9 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.037,3.137c-.751,.288-1.287,1.01-1.287,1.863V13.25c0,1.104,.895,2,2,2H13.25c1.105,0,2-.896,2-2V5c0-.853-.535-1.575-1.287-1.863"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.5 3.25L6.5 3.25"
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

export default tableRowNewTop;
