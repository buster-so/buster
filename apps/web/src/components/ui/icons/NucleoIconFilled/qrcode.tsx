import type { iconProps } from './iconProps';

function qrcode(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px qrcode';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.75,8.5H3.75c-.965,0-1.75-.785-1.75-1.75V3.75c0-.965,.785-1.75,1.75-1.75h3c.965,0,1.75,.785,1.75,1.75v3c0,.965-.785,1.75-1.75,1.75ZM3.75,3.5c-.138,0-.25,.112-.25,.25v3c0,.138,.112,.25,.25,.25h3c.138,0,.25-.112,.25-.25V3.75c0-.138-.112-.25-.25-.25H3.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,8.5h-3c-.965,0-1.75-.785-1.75-1.75V3.75c0-.965,.785-1.75,1.75-1.75h3c.965,0,1.75,.785,1.75,1.75v3c0,.965-.785,1.75-1.75,1.75Zm-3-5c-.138,0-.25,.112-.25,.25v3c0,.138,.112,.25,.25,.25h3c.138,0,.25-.112,.25-.25V3.75c0-.138-.112-.25-.25-.25h-3Z"
          fill="currentColor"
        />
        <path
          d="M6.75,16H3.75c-.965,0-1.75-.785-1.75-1.75v-3c0-.965,.785-1.75,1.75-1.75h3c.965,0,1.75,.785,1.75,1.75v3c0,.965-.785,1.75-1.75,1.75Zm-3-5c-.138,0-.25,.112-.25,.25v3c0,.138,.112,.25,.25,.25h3c.138,0,.25-.112,.25-.25v-3c0-.138-.112-.25-.25-.25H3.75Z"
          fill="currentColor"
        />
        <path d="M4.5 4.5H6V6H4.5z" fill="currentColor" />
        <path d="M12 4.5H13.5V6H12z" fill="currentColor" />
        <path d="M4.5 12H6V13.5H4.5z" fill="currentColor" />
        <path d="M14.5 14.5H16V16H14.5z" fill="currentColor" />
        <path d="M13 13H14.5V14.5H13z" fill="currentColor" />
        <path d="M14.5 11.5H16V13H14.5z" fill="currentColor" />
        <path d="M11 14.5H13V16H11z" fill="currentColor" />
        <path d="M9.5 11.5H11V14.5H9.5z" fill="currentColor" />
        <path d="M11 10H14.5V11.5H11z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default qrcode;
