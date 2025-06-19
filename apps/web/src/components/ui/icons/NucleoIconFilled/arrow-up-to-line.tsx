import type { iconProps } from './iconProps';

function arrowUpToLine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow up to line';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.75,2H1.25c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h9.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9.53,6.72l-3-3c-.293-.293-.768-.293-1.061,0l-3,3c-.293.293-.293.768,0,1.061s.768.293,1.061,0l1.72-1.72v4.689c0,.414.336.75.75.75s.75-.336.75-.75v-4.689l1.72,1.72c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowUpToLine;
