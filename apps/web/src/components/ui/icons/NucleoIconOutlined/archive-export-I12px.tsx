import type { iconProps } from './iconProps';

function archiveExport(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px archive export';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m10.75,6.75h-3v1c0,.276-.224.5-.5.5h-2.5c-.276,0-.5-.224-.5-.5v-1H1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6 4.5L6 1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.25,2.75v6c0,1.105.895,2,2,2h5.5c1.105,0,2-.895,2-2V2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75 3L6 0.75 8.25 3"
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

export default archiveExport;
