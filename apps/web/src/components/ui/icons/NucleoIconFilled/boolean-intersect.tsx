import type { iconProps } from './iconProps';

function booleanIntersect(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px boolean intersect';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,6h-2.25V3.75c0-.965-.785-1.75-1.75-1.75H3.75c-.965,0-1.75,.785-1.75,1.75v6.5c0,.965,.785,1.75,1.75,1.75h2.25v2.25c0,.965,.785,1.75,1.75,1.75h6.5c.965,0,1.75-.785,1.75-1.75V7.75c0-.965-.785-1.75-1.75-1.75Zm.25,8.25c0,.138-.112,.25-.25,.25H7.75c-.138,0-.25-.112-.25-.25v-3.75H3.75c-.138,0-.25-.112-.25-.25V3.75c0-.138,.112-.25,.25-.25h6.5c.138,0,.25,.112,.25,.25v3.75h3.75c.138,0,.25,.112,.25,.25v6.5Z"
          fill="currentColor"
        />
        <path
          d="M7.75,6h4.25v4.25c0,.966-.784,1.75-1.75,1.75H6V7.75c0-.966,.784-1.75,1.75-1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default booleanIntersect;
