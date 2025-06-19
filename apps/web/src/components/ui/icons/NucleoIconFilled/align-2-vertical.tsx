import type { iconProps } from './iconProps';

function align2Vertical(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px align 2 vertical';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.25,6.75H.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h10.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <rect
          height="9"
          width="6"
          fill="currentColor"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="3"
          y="1.5"
        />
      </g>
    </svg>
  );
}

export default align2Vertical;
