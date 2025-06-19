import type { iconProps } from './iconProps';

function keyboardMouse(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px keyboard mouse';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.75,12.5H2.75c-1.517,0-2.75-1.233-2.75-2.75V5.25c0-1.517,1.233-2.75,2.75-2.75H15.25c1.517,0,2.75,1.233,2.75,2.75v2.25c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.25c0-.689-.561-1.25-1.25-1.25H2.75c-.689,0-1.25,.561-1.25,1.25v4.5c0,.689,.561,1.25,1.25,1.25h6c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,9.5h-2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,8h-1c-1.517,0-2.75,1.233-2.75,2.75v3.5c0,1.517,1.233,2.75,2.75,2.75h1c1.517,0,2.75-1.233,2.75-2.75v-3.5c0-1.517-1.233-2.75-2.75-2.75Zm.25,4.25c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1Z"
          fill="currentColor"
        />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="3" y="5.5" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="3" y="8" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="5.5" y="5.5" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="8.25" y="5.5" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="13.5" y="5.5" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="11" y="5.5" />
      </g>
    </svg>
  );
}

export default keyboardMouse;
