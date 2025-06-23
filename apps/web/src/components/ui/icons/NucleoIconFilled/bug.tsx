import type { iconProps } from './iconProps';

function bug(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px bug';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m2.75,7.5H.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h2c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m2.75,5c-1.517,0-2.75-1.233-2.75-2.75,0-.414.336-.75.75-.75s.75.336.75.75c0,.689.561,1.25,1.25,1.25.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m.75,12c-.414,0-.75-.336-.75-.75,0-1.517,1.233-2.75,2.75-2.75.414,0,.75.336.75.75s-.336.75-.75.75c-.689,0-1.25.561-1.25,1.25,0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.25,7.5h-2c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h2c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9.25,5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75c.689,0,1.25-.561,1.25-1.25,0-.414.336-.75.75-.75s.75.336.75.75c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.25,12c-.414,0-.75-.336-.75-.75,0-.689-.561-1.25-1.25-1.25-.414,0-.75-.336-.75-.75s.336-.75.75-.75c1.517,0,2.75,1.233,2.75,2.75,0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m7.929,1.5c-.223-.861-.998-1.5-1.929-1.5s-1.706.639-1.929,1.5h3.859Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m8.25,3H3.75c-.965,0-1.75.785-1.75,1.75v3.25c0,1.949,1.402,3.571,3.25,3.924v-3.174c0-.414.336-.75.75-.75s.75.336.75.75v3.174c1.848-.353,3.25-1.975,3.25-3.924v-3.25c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default bug;
