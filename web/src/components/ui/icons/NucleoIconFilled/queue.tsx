import type { iconProps } from './iconProps';

function queue(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px queue';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect
          height="6"
          width="11"
          fill="currentColor"
          rx="2.25"
          ry="2.25"
          strokeWidth="0"
          x=".5"
        />
        <path
          d="m10.75,9H1.25c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h9.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.75,12H1.25c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h9.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default queue;
