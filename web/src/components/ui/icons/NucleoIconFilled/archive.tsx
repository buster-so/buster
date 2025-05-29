import type { iconProps } from './iconProps';

function archive(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px archive';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.75.5H3.25C1.733.5.5,1.733.5,3.25v5.5c0,1.517,1.233,2.75,2.75,2.75h5.5c1.517,0,2.75-1.233,2.75-2.75V3.25c0-1.517-1.233-2.75-2.75-2.75Zm-5.5,1.5h5.5c.69,0,1.25.56,1.25,1.25v2.75h-1.25c-.414,0-.75.336-.75.75v1.25h-4v-1.25c0-.414-.336-.75-.75-.75h-1.25v-2.75c0-.69.56-1.25,1.25-1.25Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default archive;
