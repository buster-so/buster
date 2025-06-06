import type { iconProps } from './iconProps';

function scanCode(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px scan code';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,7c.414,0,.75-.336,.75-.75v-1.5c0-.689,.561-1.25,1.25-1.25h2c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2c-1.517,0-2.75,1.233-2.75,2.75v1.5c0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.25,2h-2c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2c.689,0,1.25,.561,1.25,1.25v1.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.5c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,11c-.414,0-.75,.336-.75,.75v1.5c0,.689-.561,1.25-1.25,1.25h-2c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2c1.517,0,2.75-1.233,2.75-2.75v-1.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M6.75,14.5h-2c-.689,0-1.25-.561-1.25-1.25v-1.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.5c0,1.517,1.233,2.75,2.75,2.75h2c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <rect height="3.5" width="3.5" fill="currentColor" rx=".75" ry=".75" x="5" y="5" />
        <rect height="3.5" width="3.5" fill="currentColor" rx=".75" ry=".75" x="9.5" y="5" />
        <rect height="3.5" width="3.5" fill="currentColor" rx=".75" ry=".75" x="5" y="9.5" />
        <rect height="3.5" width="3.5" fill="currentColor" rx=".75" ry=".75" x="9.5" y="9.5" />
      </g>
    </svg>
  );
}

export default scanCode;
