import type { iconProps } from './iconProps';

function rectCenterY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px rect center y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect
          height="6"
          width="6"
          fill="currentColor"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="3"
          y="3"
        />
        <path
          d="m11,1.5H1c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h10c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11,12H1c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h10c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default rectCenterY;
