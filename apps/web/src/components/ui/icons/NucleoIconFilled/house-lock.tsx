import type { iconProps } from './iconProps';

function houseLock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house lock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,16.25v-1.5c0-1.129,.597-2.149,1.507-2.732,.121-1.96,1.753-3.518,3.743-3.518,.635,0,1.225,.172,1.75,.452v-1.956c0-.543-.258-1.064-.691-1.394L10.059,1.613c-.624-.475-1.495-.474-2.118,0L2.691,5.603s0,0,0,0c-.433,.329-.691,.85-.691,1.393v7.254c0,1.517,1.233,2.75,2.75,2.75h4.346c-.058-.242-.096-.491-.096-.75Z"
          fill="currentColor"
        />
        <path
          d="M16.5,13.025v-.775c0-1.241-1.01-2.25-2.25-2.25s-2.25,1.009-2.25,2.25v.775c-.846,.123-1.5,.845-1.5,1.725v1.5c0,.965,.785,1.75,1.75,1.75h4c.965,0,1.75-.785,1.75-1.75v-1.5c0-.879-.654-1.602-1.5-1.725Zm-2.25-1.525c.413,0,.75,.336,.75,.75v.75h-1.5v-.75c0-.414,.337-.75,.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default houseLock;
