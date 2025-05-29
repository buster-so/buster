import type { iconProps } from './iconProps';

function expandObj(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px expand obj';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="8" width="8" fill="currentColor" rx="2.25" ry="2.25" x="5" y="5" />
        <path
          d="M7,2.25c0-.414-.336-.75-.75-.75H3.25c-.965,0-1.75,.785-1.75,1.75v3c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.25c0-.138,.112-.25,.25-.25h3c.414,0,.75-.336,.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.75,11c-.414,0-.75,.336-.75,.75v3c0,.138-.112,.25-.25,.25h-3c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3c.965,0,1.75-.785,1.75-1.75v-3c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default expandObj;
