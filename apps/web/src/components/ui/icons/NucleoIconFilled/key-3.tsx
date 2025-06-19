import type { iconProps } from './iconProps';

function key3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px key 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.25,3.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2.75v-.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V9.752c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.252h2.079c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2.079v-1.5h2.75Z"
          fill="currentColor"
        />
        <path
          d="M8.75,9c-2.206,0-4,1.794-4,4s1.794,4,4,4,4-1.794,4-4-1.794-4-4-4Zm0,5.5c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default key3;
