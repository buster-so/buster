import type { iconProps } from './iconProps';

function tableRowMergeBottom(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table row merge bottom';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75 8.75L15.25 8.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.99,14.855c.737-.294,1.26-1.012,1.26-1.855V4.75c0-1.104-.895-2-2-2H4.75c-1.105,0-2,.896-2,2V13c0,.843,.523,1.56,1.26,1.855"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.5 14.75L9 17.25 6.5 14.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 17.25L9 11.75"
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

export default tableRowMergeBottom;
