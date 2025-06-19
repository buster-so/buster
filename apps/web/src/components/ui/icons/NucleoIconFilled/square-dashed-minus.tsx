import type { iconProps } from './iconProps';

function squareDashedMinus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px square dashed minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m1.25,5c-.414,0-.75-.336-.75-.75v-1C.5,1.733,1.733.5,3.25.5h1c.414,0,.75.336.75.75s-.336.75-.75.75h-1c-.689,0-1.25.561-1.25,1.25v1c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.75,5c-.414,0-.75-.336-.75-.75v-1c0-.689-.561-1.25-1.25-1.25h-1c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h1c1.517,0,2.75,1.233,2.75,2.75v1c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m8.75,11.5h-1c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h1c.689,0,1.25-.561,1.25-1.25v-1c0-.414.336-.75.75-.75s.75.336.75.75v1c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4.25,11.5h-1c-1.517,0-2.75-1.233-2.75-2.75v-1c0-.414.336-.75.75-.75s.75.336.75.75v1c0,.689.561,1.25,1.25,1.25h1c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m8.25,6.75H3.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h4.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default squareDashedMinus;
