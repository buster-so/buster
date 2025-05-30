import type { iconProps } from './iconProps';

function rulerPen2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ruler pen 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,1c-1.517,0-2.75,1.233-2.75,2.75V12.5c0,1.735,1.966,3.996,2.189,4.248,.143,.16,.347,.252,.561,.252s.418-.092,.561-.252c.224-.252,2.189-2.513,2.189-4.248V3.75c0-1.517-1.233-2.75-2.75-2.75Zm0,1.5c.689,0,1.25,.561,1.25,1.25v1.25h-2.5v-1.25c0-.689,.561-1.25,1.25-1.25Z"
          fill="currentColor"
        />
        <path
          d="M6.75,1.5H3.75c-.965,0-1.75,.785-1.75,1.75V14.75c0,.965,.785,1.75,1.75,1.75h3c.965,0,1.75-.785,1.75-1.75V3.25c0-.965-.785-1.75-1.75-1.75Zm.25,13.25c0,.138-.112,.25-.25,.25H3.75c-.138,0-.25-.112-.25-.25v-1.25h.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-.75v-1h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-1.75v-1h.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-.75v-1h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-1.75v-1.25c0-.138,.112-.25,.25-.25h3c.138,0,.25,.112,.25,.25V14.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default rulerPen2;
