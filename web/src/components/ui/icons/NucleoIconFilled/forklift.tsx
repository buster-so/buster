import type { iconProps } from './iconProps';

function forklift(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px forklift';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.43,3.26c-.217-.742-.908-1.26-1.68-1.26h-3c-.965,0-1.75,.785-1.75,1.75v4.25h-1.25c-1.517,0-2.75,1.233-2.75,2.75v2.75c0,1.378,1.122,2.5,2.5,2.5,1.207,0,2.217-.86,2.449-2h2.101c.232,1.14,1.242,2,2.449,2,1.378,0,2.5-1.122,2.5-2.5v-4.464c0-.261-.037-.52-.11-.77l-1.46-5.005Zm-4.93,.49c0-.138,.112-.25,.25-.25h3c.11,0,.209,.074,.24,.18l1.26,4.32H5.5V3.75ZM2.5,14.5c-.551,0-1-.449-1-1s.449-1,1-1,1,.449,1,1-.449,1-1,1Zm7,0c-.551,0-1-.449-1-1s.449-1,1-1,1,.449,1,1-.449,1-1,1Z"
          fill="currentColor"
        />
        <path
          d="M17.25,14.5h-2.5c-.138,0-.25-.112-.25-.25V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V14.25c0,.965,.785,1.75,1.75,1.75h2.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default forklift;
