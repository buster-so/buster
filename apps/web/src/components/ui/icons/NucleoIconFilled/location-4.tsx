import type { iconProps } from './iconProps';

function location4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px location 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9,3c0-1.654-1.346-3-3-3s-3,1.346-3,3c0,1.394.96,2.558,2.25,2.893v2.857c0,.414.336.75.75.75s.75-.336.75-.75v-2.857c1.29-.335,2.25-1.5,2.25-2.893Z"
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

export default location4;
