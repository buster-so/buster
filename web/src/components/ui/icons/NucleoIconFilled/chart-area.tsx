import type { iconProps } from './iconProps';

function chartArea(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart area';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,14H4.75c-.689,0-1.25-.561-1.25-1.25V2.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V12.75c0,1.517,1.233,2.75,2.75,2.75H15.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M5.25,13H14.25c.414,0,.75-.336,.75-.75V5.75c0-.303-.183-.577-.463-.693-.279-.117-.603-.052-.817,.163l-3.419,3.419-1.974-2.369c-.285-.343-.867-.343-1.152,0l-2.5,3c-.112,.135-.174,.305-.174,.48v2.5c0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chartArea;
