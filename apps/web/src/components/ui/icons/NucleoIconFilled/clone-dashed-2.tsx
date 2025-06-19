import type { iconProps } from './iconProps';

function cloneDashed2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px clone dashed 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.25,4.5c-.414,0-.75-.336-.75-.75v-1.5c0-.414-.336-.75-.75-.75h-.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h.75c1.241,0,2.25,1.009,2.25,2.25v1.5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m3.667,9h-1.417c-1.241,0-2.25-1.009-2.25-2.25v-.75c0-.414.336-.75.75-.75s.75.336.75.75v.75c0,.414.336.75.75.75h1.417c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m.75,3.75c-.414,0-.75-.336-.75-.75v-.75C0,1.009,1.009,0,2.25,0h.75c.414,0,.75.336.75.75s-.336.75-.75.75h-.75c-.414,0-.75.336-.75.75v.75c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <rect
          height="9"
          width="9"
          fill="currentColor"
          rx="2.25"
          ry="2.25"
          strokeWidth="0"
          x="3"
          y="3"
        />
      </g>
    </svg>
  );
}

export default cloneDashed2;
