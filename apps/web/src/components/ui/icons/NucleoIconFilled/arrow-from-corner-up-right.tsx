import type { iconProps } from './iconProps';

function arrowFromCornerUpRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow from corner up right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9.5,11.5H3.25c-1.517,0-2.75-1.233-2.75-2.75V2.5c0-.414.336-.75.75-.75s.75.336.75.75v6.25c0,.689.561,1.25,1.25,1.25h6.25c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.75.5h-4.25c-.414,0-.75.336-.75.75s.336.75.75.75h2.439l-4.72,4.72c-.293.293-.293.768,0,1.061.146.146.338.22.53.22s.384-.073.53-.22l4.72-4.72v2.439c0,.414.336.75.75.75s.75-.336.75-.75V1.25c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowFromCornerUpRight;
