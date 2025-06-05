import type { iconProps } from './iconProps';

function clipboardCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px clipboard check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m5.334,9.472c-.198,0-.389-.078-.53-.219l-1.334-1.331c-.293-.293-.294-.768-.001-1.061.293-.292.768-.294,1.061-.001l.723.722,2.147-2.86c.249-.331.719-.398,1.05-.149.332.249.398.719.149,1.05l-2.666,3.55c-.13.174-.33.282-.546.298-.018.001-.036.002-.053.002Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m8.25,12H3.75c-1.517,0-2.75-1.233-2.75-2.75V3.75c0-1.517,1.233-2.75,2.75-2.75h.5c.414,0,.75.336.75.75s-.336.75-.75.75h-.5c-.689,0-1.25.561-1.25,1.25v5.5c0,.689.561,1.25,1.25,1.25h4.5c.689,0,1.25-.561,1.25-1.25V3.75c0-.689-.561-1.25-1.25-1.25h-.5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h.5c1.517,0,2.75,1.233,2.75,2.75v5.5c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <rect
          height="3.5"
          width="5"
          fill="currentColor"
          rx="1.25"
          ry="1.25"
          strokeWidth="0"
          x="3.5"
        />
      </g>
    </svg>
  );
}

export default clipboardCheck;
