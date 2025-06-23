import type { iconProps } from './iconProps';

function fullScreen(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px full screen';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M1.75,7.5c.414,0,.75-.336,.75-.75v-2c0-.689,.561-1.25,1.25-1.25h2c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v2c0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,2h-2c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2c.689,0,1.25,.561,1.25,1.25v2c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,10.5c-.414,0-.75,.336-.75,.75v2c0,.689-.561,1.25-1.25,1.25h-2c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2c1.517,0,2.75-1.233,2.75-2.75v-2c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M5.75,14.5H3.75c-.689,0-1.25-.561-1.25-1.25v-2c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2c0,1.517,1.233,2.75,2.75,2.75h2c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <rect height="8" width="10" fill="currentColor" rx=".75" ry=".75" x="4" y="5" />
      </g>
    </svg>
  );
}

export default fullScreen;
