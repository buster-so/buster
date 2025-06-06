import type { iconProps } from './iconProps';

function borderY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px border y';

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
          d="m10.75,11.5H1.25c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h9.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <circle cx="6" cy="6" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="6" cy="3.25" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="6" cy="8.75" fill="currentColor" r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default borderY;
