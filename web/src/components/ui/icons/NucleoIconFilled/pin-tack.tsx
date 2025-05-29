import type { iconProps } from './iconProps';

function pinTack(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px pin tack';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,12c-.414,0-.75-.336-.75-.75v-3c0-.414.336-.75.75-.75s.75.336.75.75v3c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9.5,4.95v-2.2c0-1.517-1.233-2.75-2.75-2.75h-1.5c-1.517,0-2.75,1.233-2.75,2.75v2.2c-.785.869-1.286,1.937-1.49,3.178-.035.217.026.439.169.607.142.168.352.265.571.265h8.5c.22,0,.43-.097.571-.265.143-.168.204-.39.169-.607-.204-1.241-.705-2.309-1.49-3.178Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default pinTack;
