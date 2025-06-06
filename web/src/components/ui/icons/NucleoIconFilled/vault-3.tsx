import type { iconProps } from './iconProps';

function vault3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px vault 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4.75,17.5c-.414,0-.75-.336-.75-.75v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.25,17.5c-.414,0-.75-.336-.75-.75v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75v.25h-.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.25v1.75h-.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.25v1.75h-.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.25v.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-3.5,7.851v1.649c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.649c-.732-.297-1.25-1.014-1.25-1.851,0-1.103,.897-2,2-2s2,.897,2,2c0,.837-.518,1.554-1.25,1.851Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default vault3;
