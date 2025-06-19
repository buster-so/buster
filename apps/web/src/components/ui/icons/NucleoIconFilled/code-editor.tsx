import type { iconProps } from './iconProps';

function codeEditor(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px code editor';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-1.5,5.75c0,.414-.336,.75-.75,.75h-2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.75c.414,0,.75,.336,.75,.75ZM4.5,14.5h-.75c-.689,0-1.25-.561-1.25-1.25V4.75c0-.689,.561-1.25,1.25-1.25h.75V14.5ZM7,5.25c0-.414,.336-.75,.75-.75h1.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-1.5c-.414,0-.75-.336-.75-.75Zm4.25,8.25h-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm2.5-2.5h-3c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default codeEditor;
