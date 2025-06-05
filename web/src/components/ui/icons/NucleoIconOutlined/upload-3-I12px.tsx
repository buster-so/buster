import type { iconProps } from './iconProps';

function upload3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px upload 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6 1L6 8.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.25 3L6 0.75 3.75 3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m3.5,5.25h-.75c-1.105,0-2,.895-2,2v2c0,1.105.895,2,2,2h6.5c1.105,0,2-.895,2-2v-2c0-1.105-.895-2-2-2h-.75"
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

export default upload3;
