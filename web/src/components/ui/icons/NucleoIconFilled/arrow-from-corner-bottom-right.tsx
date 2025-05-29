import type { iconProps } from './iconProps';

function arrowFromCornerBottomRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow from corner bottom right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.75,5.75c-.414,0-.75.336-.75.75v2.439l-4.72-4.72c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l4.72,4.72h-2.439c-.414,0-.75.336-.75.75s.336.75.75.75h4.25c.414,0,.75-.336.75-.75v-4.25c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m1.25,10.25c-.414,0-.75-.336-.75-.75V3.25C.5,1.733,1.733.5,3.25.5h6.25c.414,0,.75.336.75.75s-.336.75-.75.75H3.25c-.689,0-1.25.561-1.25,1.25v6.25c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowFromCornerBottomRight;
