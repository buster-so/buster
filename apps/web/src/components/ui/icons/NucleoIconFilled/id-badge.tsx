import type { iconProps } from './iconProps';

function idBadge(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px id badge';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,0c-.827,0-1.5,.673-1.5,1.5v1.75c0,.414,.336,.75,.75,.75h1.5c.414,0,.75-.336,.75-.75V1.5c0-.827-.673-1.5-1.5-1.5Z"
          fill="currentColor"
        />
        <path
          d="M14.25,3h-2.25v.25c0,1.241-1.009,2.25-2.25,2.25h-1.5c-1.241,0-2.25-1.009-2.25-2.25v-.25H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V5.75c0-1.517-1.233-2.75-2.75-2.75Zm-5.75,7.75c0,.414-.336,.75-.75,.75h-3c-.414,0-.75-.336-.75-.75v-3c0-.414,.336-.75,.75-.75h3c.414,0,.75,.336,.75,.75v3Zm4.75,.75h-2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm0-3h-2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default idBadge;
