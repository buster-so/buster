import type { iconProps } from './iconProps';

function tabsMinus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px tabs minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.75,2H6.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.75v2.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.5h1.75c.689,0,1.25,.561,1.25,1.25v1.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.5c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M10,14.25c0-1.241,1.01-2.25,2.25-2.25h4.25V6.25c0-.414-.336-.75-.75-.75H7.5V2.75c0-.414-.336-.75-.75-.75h-2.5c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h6.603c-.516-.413-.853-1.04-.853-1.75Z"
          fill="currentColor"
        />
        <path
          d="M17.25,13.5h-5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tabsMinus;
