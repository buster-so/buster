import type { iconProps } from './iconProps';

function arrowToCornerTopLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow to corner top left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m1.25,10.25c-.414,0-.75-.336-.75-.75V3.25C.5,1.733,1.733.5,3.25.5h6.25c.414,0,.75.336.75.75s-.336.75-.75.75H3.25c-.689,0-1.25.561-1.25,1.25v6.25c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6.561,5.5h2.439c.414,0,.75-.336.75-.75s-.336-.75-.75-.75h-4.25c-.414,0-.75.336-.75.75v4.25c0,.414.336.75.75.75s.75-.336.75-.75v-2.439l4.72,4.72c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061l-4.72-4.72Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowToCornerTopLeft;
