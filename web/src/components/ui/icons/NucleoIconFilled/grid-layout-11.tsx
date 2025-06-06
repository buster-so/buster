import type { iconProps } from './iconProps';

function gridLayout11(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px grid layout 11';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect
          height="5"
          width="14"
          fill="currentColor"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="2"
          y="2"
        />
        <rect
          height="7.5"
          width="6.5"
          fill="currentColor"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="2"
          y="8.5"
        />
        <path
          d="m15.25,8.5h-4.5c-.414,0-.75.336-.75.75s.336.75.75.75h4.5c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m15.25,11.5h-4.5c-.414,0-.75.336-.75.75s.336.75.75.75h4.5c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m15.25,14.5h-4.5c-.414,0-.75.336-.75.75s.336.75.75.75h4.5c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default gridLayout11;
