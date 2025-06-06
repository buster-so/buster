import type { iconProps } from './iconProps';

function link2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px link 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.75,6.75H3.25c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h5.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m3.75,10.5H1.75c-.965,0-1.75-.785-1.75-1.75V3.344c0-.965.785-1.75,1.75-1.75h2c.965,0,1.75.785,1.75,1.75v.156c0,.414-.336.75-.75.75s-.75-.336-.75-.75v-.156c0-.138-.112-.25-.25-.25H1.75c-.138,0-.25.112-.25.25v5.406c0,.138.112.25.25.25h2c.138,0,.25-.112.25-.25v-.25c0-.414.336-.75.75-.75s.75.336.75.75v.25c0,.965-.785,1.75-1.75,1.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.25,10.5h-2c-.965,0-1.75-.785-1.75-1.75v-.25c0-.414.336-.75.75-.75s.75.336.75.75v.25c0,.138.112.25.25.25h2c.138,0,.25-.112.25-.25V3.344c0-.138-.112-.25-.25-.25h-2c-.138,0-.25.112-.25.25v.156c0,.414-.336.75-.75.75s-.75-.336-.75-.75v-.156c0-.965.785-1.75,1.75-1.75h2c.965,0,1.75.785,1.75,1.75v5.406c0,.965-.785,1.75-1.75,1.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default link2;
