import type { iconProps } from './iconProps';

function layoutBottom(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px layout bottom';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9.25,1H2.75C1.233,1,0,2.233,0,3.75v4.5c0,1.517,1.233,2.75,2.75,2.75h6.5c1.517,0,2.75-1.233,2.75-2.75V3.75c0-1.517-1.233-2.75-2.75-2.75Zm-.5,7.5H3.25c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h5.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default layoutBottom;
