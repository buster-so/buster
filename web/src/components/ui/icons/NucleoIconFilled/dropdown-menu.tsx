import type { iconProps } from './iconProps';

function dropdownMenu(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dropdown menu';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13,8.25c0-.414-.336-.75-.75-.75H5.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6.5c.414,0,.75-.336,.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M5.75,6h4.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H5.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M5.75,10.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.501c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2.501Z"
          fill="currentColor"
        />
        <path
          d="M17.324,12.233l-5.94-2.17h0c-.38-.139-.794-.047-1.081,.239-.286,.286-.378,.701-.239,1.082l2.17,5.94c.148,.407,.536,.676,.967,.676h.021c.44-.009,.826-.296,.96-.716l.752-2.351,2.352-.752c.419-.134,.706-.52,.715-.96,.008-.44-.263-.837-.676-.988Z"
          fill="currentColor"
        />
        <path
          d="M9.43,14H4.75c-.689,0-1.25-.561-1.25-1.25V3.75c0-.689,.561-1.25,1.25-1.25H13.25c.689,0,1.25,.561,1.25,1.25v5.863c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.75c0-1.517-1.233-2.75-2.75-2.75H4.75c-1.517,0-2.75,1.233-2.75,2.75V12.75c0,1.517,1.233,2.75,2.75,2.75h4.68c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default dropdownMenu;
