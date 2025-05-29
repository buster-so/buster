import type { iconProps } from './iconProps';

function objsUngroup(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px objs ungroup';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="9" width="9" fill="currentColor" rx="1.75" ry="1.75" x="2" y="2" />
        <path
          d="M14.25,7h-1.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.5c.138,0,.25,.112,.25,.25v5.5c0,.138-.112,.25-.25,.25h-5.5c-.138,0-.25-.112-.25-.25v-1.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.5c0,.965,.785,1.75,1.75,1.75h5.5c.965,0,1.75-.785,1.75-1.75v-5.5c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default objsUngroup;
