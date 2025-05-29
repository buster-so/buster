import type { iconProps } from './iconProps';

function tableRowsMinus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table rows minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16,8.25v-3.5c0-1.517-1.233-2.75-2.75-2.75H4.75c-1.517,0-2.75,1.233-2.75,2.75v3.5h14Z"
          fill="currentColor"
        />
        <path
          d="M10,14.25c0-1.241,1.01-2.25,2.25-2.25h3.75v-2.25H2v3.5c0,1.517,1.233,2.75,2.75,2.75h6.103c-.516-.413-.853-1.04-.853-1.75Z"
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

export default tableRowsMinus;
