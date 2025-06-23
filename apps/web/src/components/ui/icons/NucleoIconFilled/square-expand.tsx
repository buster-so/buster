import type { iconProps } from './iconProps';

function squareExpand(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square expand';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75ZM7.5,13.5h-2.25c-.414,0-.75-.336-.75-.75v-2.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5h1.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm0-7.5h-1.5v1.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.25c0-.414,.336-.75,.75-.75h2.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm6,6.75c0,.414-.336,.75-.75,.75h-2.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.5v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.25Zm0-5.25c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.5h-1.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.25c.414,0,.75,.336,.75,.75v2.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default squareExpand;
