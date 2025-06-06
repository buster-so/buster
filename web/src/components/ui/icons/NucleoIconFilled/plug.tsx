import type { iconProps } from './iconProps';

function plug(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px plug';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,12c-.414,0-.75-.336-.75-.75v-2c0-.414.336-.75.75-.75s.75.336.75.75v2c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m3.75,3.5c-.414,0-.75-.336-.75-.75V.75c0-.414.336-.75.75-.75s.75.336.75.75v2c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m8.25,3.5c-.414,0-.75-.336-.75-.75V.75c0-.414.336-.75.75-.75s.75.336.75.75v2c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9.25,2H2.75c-.965,0-1.75.785-1.75,1.75v1.25c0,2.757,2.243,5,5,5s5-2.243,5-5v-1.25c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default plug;
