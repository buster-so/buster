import type { iconProps } from './iconProps';

function tabs(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px tabs';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.75,5.75c-.414,0-.75-.336-.75-.75v-1.75c0-.689-.561-1.25-1.25-1.25h-3.5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h3.5c1.517,0,2.75,1.233,2.75,2.75v1.75c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.75,4h-4.75V1.25c0-.414-.336-.75-.75-.75h-2C1.733.5.5,1.733.5,3.25v5.5c0,1.517,1.233,2.75,2.75,2.75h5.5c1.517,0,2.75-1.233,2.75-2.75v-4c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default tabs;
