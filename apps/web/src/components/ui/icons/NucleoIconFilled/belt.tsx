import type { iconProps } from './iconProps';

function belt(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px belt';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.5,12V6H1.75c-.966,0-1.75,.784-1.75,1.75v2.5c0,.966,.784,1.75,1.75,1.75H6.5Z"
          fill="currentColor"
        />
        <path
          d="M11.5,12V6s4.75,0,4.75,0c.966,0,1.75,.784,1.75,1.75v2.5c0,.966-.784,1.75-1.75,1.75h-4.75Z"
          fill="currentColor"
        />
        <path
          d="M10.75,4.5h-3.5c-.965,0-1.75,.785-1.75,1.75v5.5c0,.965,.785,1.75,1.75,1.75h3.5c.965,0,1.75-.785,1.75-1.75V6.25c0-.965-.785-1.75-1.75-1.75Zm0,7.5h-3.5c-.138,0-.25-.112-.25-.25V6.25c0-.138,.112-.25,.25-.25h3.5c.138,0,.25,.112,.25,.25v2h-1.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.25v2c0,.138-.112,.25-.25,.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default belt;
