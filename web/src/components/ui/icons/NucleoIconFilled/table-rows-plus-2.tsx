import type { iconProps } from './iconProps';

function tableRowsPlus2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table rows plus 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17,5.5v-.75c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v.75H17Z"
          fill="currentColor"
        />
        <path
          d="M9.5,14.25c0-.71,.337-1.337,.853-1.75H1v.75c0,1.517,1.233,2.75,2.75,2.75h6.603c-.516-.413-.853-1.04-.853-1.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,9.5c.976,0,1.801,.629,2.112,1.5h.638V7H1v4H12.138c.311-.871,1.135-1.5,2.112-1.5Z"
          fill="currentColor"
        />
        <path
          d="M16.75,13.5h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tableRowsPlus2;
