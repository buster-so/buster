import type { iconProps } from './iconProps';

function scanLock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px scan lock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.75,9c-.414,0-.75-.336-.75-.75v-1.75c0-.551-.448-1-1-1s-1,.449-1,1v1.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.75c0-1.378,1.121-2.5,2.5-2.5s2.5,1.122,2.5,2.5v1.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M2.75,7c-.414,0-.75-.336-.75-.75v-1.5c0-1.517,1.233-2.75,2.75-2.75h2c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-2c-.689,0-1.25,.561-1.25,1.25v1.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,7c-.414,0-.75-.336-.75-.75v-1.5c0-.689-.561-1.25-1.25-1.25h-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2c1.517,0,2.75,1.233,2.75,2.75v1.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.25,16h-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2c.689,0,1.25-.561,1.25-1.25v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
        />
        <path
          d="M6.75,16h-2c-1.517,0-2.75-1.233-2.75-2.75v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5c0,.689,.561,1.25,1.25,1.25h2c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <rect height="5.5" width="8" fill="currentColor" rx="2" ry="2" x="5" y="7.5" />
      </g>
    </svg>
  );
}

export default scanLock;
