import type { iconProps } from './iconProps';

function inputPasswordAlert(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px input password alert';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="5.5" cy="9" fill="currentColor" r="1" />
        <circle cx="9" cy="9" fill="currentColor" r="1" />
        <path
          d="M7.191,14H3.75c-1.517,0-2.75-1.233-2.75-2.75V6.75c0-1.517,1.233-2.75,2.75-2.75H14.25c1.517,0,2.75,1.233,2.75,2.75v2.459c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.459c0-.689-.561-1.25-1.25-1.25H3.75c-.689,0-1.25,.561-1.25,1.25v4.5c0,.689,.561,1.25,1.25,1.25h3.441c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M17.412,14.313l-2.933-4.631c-.323-.509-.875-.814-1.479-.814s-1.156,.305-1.479,.814l-2.933,4.631c-.341,.539-.362,1.221-.055,1.78s.895,.906,1.533,.906h5.866c.638,0,1.226-.347,1.533-.906s.287-1.241-.055-1.78Zm-4.412,1.687c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm.75-3c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default inputPasswordAlert;
