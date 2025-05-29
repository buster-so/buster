import type { iconProps } from './iconProps';

function smoking(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px smoking';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,10H2.75c-.965,0-1.75,.785-1.75,1.75v1.5c0,.965,.785,1.75,1.75,1.75H15.25c.965,0,1.75-.785,1.75-1.75v-1.5c0-.965-.785-1.75-1.75-1.75Zm.25,3.25c0,.138-.112,.25-.25,.25h-3.25v-2h3.25c.138,0,.25,.112,.25,.25v1.5Z"
          fill="currentColor"
        />
        <path
          d="M12.75,9c-.414,0-.75-.336-.75-.75v-.25c0-1.103-.897-2-2-2-1.93,0-3.5-1.57-3.5-3.5v-.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v.25c0,1.103,.897,2,2,2,1.93,0,3.5,1.57,3.5,3.5v.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.75,9c-.414,0-.75-.336-.75-.75v-.5c0-2.619-2.131-4.75-4.75-4.75-.414,0-.75-.336-.75-.75s.336-.75,.75-.75c3.446,0,6.25,2.804,6.25,6.25v.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default smoking;
