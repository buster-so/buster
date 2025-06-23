import type { iconProps } from './iconProps';

function mobile(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px mobile';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m7.25,4h-2.5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h2.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m8.25,12H3.75c-1.517,0-2.75-1.233-2.75-2.75V2.75C1,1.233,2.233,0,3.75,0h4.5c1.517,0,2.75,1.233,2.75,2.75v6.5c0,1.517-1.233,2.75-2.75,2.75ZM3.75,1.5c-.689,0-1.25.561-1.25,1.25v6.5c0,.689.561,1.25,1.25,1.25h4.5c.689,0,1.25-.561,1.25-1.25V2.75c0-.689-.561-1.25-1.25-1.25H3.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default mobile;
