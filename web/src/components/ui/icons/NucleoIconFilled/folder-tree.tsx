import type { iconProps } from './iconProps';

function folderTree(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px folder tree';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,2h-1.786l-.35-.401c-.333-.381-.813-.599-1.318-.599h-1.046c-.965,0-1.75,.785-1.75,1.75v3.5c0,.965,.785,1.75,1.75,1.75h4.5c.965,0,1.75-.785,1.75-1.75V3.75c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,11h-1.786l-.35-.401c-.333-.381-.813-.599-1.318-.599h-1.046c-.965,0-1.75,.785-1.75,1.75v3.5c0,.965,.785,1.75,1.75,1.75h4.5c.965,0,1.75-.785,1.75-1.75v-2.5c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
        <path
          d="M6.25,13h-2c-.414,0-.75-.336-.75-.75V5.362c.236,.084,.486,.138,.75,.138h2c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2c-.414,0-.75-.336-.75-.75V1c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V12.25c0,1.241,1.009,2.25,2.25,2.25h2c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default folderTree;
