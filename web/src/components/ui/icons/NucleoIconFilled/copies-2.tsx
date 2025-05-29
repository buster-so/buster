import type { iconProps } from './iconProps';

function copies2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px copies 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect
          height="8.5"
          width="8.5"
          fill="currentColor"
          rx="2.25"
          ry="2.25"
          strokeWidth="0"
          y="3"
        />
        <path
          d="m9.25,1.5H2.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h6.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default copies2;
