import type { iconProps } from './iconProps';

function folder(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px folder';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.25,8c-.414,0-.75-.336-.75-.75v-2.5c0-.689-.561-1.25-1.25-1.25h-2.636c-.228,0-.442-.103-.585-.281l-.604-.752c-.238-.297-.594-.467-.975-.467h-1.701c-.689,0-1.25.561-1.25,1.25v4c0,.414-.336.75-.75.75s-.75-.336-.75-.75V3.25C0,1.733,1.233.5,2.75.5h1.701c.838,0,1.619.375,2.145,1.028l.378.472h2.276c1.517,0,2.75,1.233,2.75,2.75v2.5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <rect
          height="7"
          width="7"
          fill="currentColor"
          rx="2.75"
          ry="2.75"
          strokeWidth="0"
          x="0"
          y="4.5"
        />
      </g>
    </svg>
  );
}

export default folder;
