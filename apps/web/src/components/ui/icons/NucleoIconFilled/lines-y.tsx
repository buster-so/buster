import type { iconProps } from './iconProps';

function linesY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px lines y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,2c-.414,0-.75,.336-.75,.75V15.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,4c-.414,0-.75,.336-.75,.75V15.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V4.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M7,7c-.414,0-.75,.336-.75,.75v7.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V7.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M11,11c-.414,0-.75,.336-.75,.75v3.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default linesY;
