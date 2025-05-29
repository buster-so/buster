import type { iconProps } from './iconProps';

function textTool(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text tool';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.25,5.5H6.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.5v4.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V7h1.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.75,5.5c.689,0,1.25-.561,1.25-1.25V2.25c0-.689-.561-1.25-1.25-1.25h-2c-.689,0-1.25,.561-1.25,1.25v.25H5.5v-.25c0-.689-.561-1.25-1.25-1.25H2.25c-.689,0-1.25,.561-1.25,1.25v2c0,.689,.561,1.25,1.25,1.25h.25v7h-.25c-.689,0-1.25,.561-1.25,1.25v2c0,.689,.561,1.25,1.25,1.25h2c.689,0,1.25-.561,1.25-1.25v-.25h7v.25c0,.689,.561,1.25,1.25,1.25h2c.689,0,1.25-.561,1.25-1.25v-2c0-.689-.561-1.25-1.25-1.25h-.25V5.5h.25Zm-1.75,7h-.25c-.689,0-1.25,.561-1.25,1.25v.25H5.5v-.25c0-.689-.561-1.25-1.25-1.25h-.25V5.5h.25c.689,0,1.25-.561,1.25-1.25v-.25h7v.25c0,.689,.561,1.25,1.25,1.25h.25v7Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default textTool;
