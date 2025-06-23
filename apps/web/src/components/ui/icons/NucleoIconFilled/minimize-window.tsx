import type { iconProps } from './iconProps';

function minimizeWindow(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px minimize window';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.75,11.5H3.75c-.689,0-1.25-.561-1.25-1.25V5.75c0-.689,.561-1.25,1.25-1.25H12.25c.689,0,1.25,.561,1.25,1.25v2c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v4.5c0,1.517,1.233,2.75,2.75,2.75h2c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M8,6.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.189l-1.72-1.72c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.72,1.72h-1.189c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3c.414,0,.75-.336,.75-.75v-3Z"
          fill="currentColor"
        />
        <rect height="6" width="9" fill="currentColor" rx="2.25" ry="2.25" x="8" y="10" />
      </g>
    </svg>
  );
}

export default minimizeWindow;
