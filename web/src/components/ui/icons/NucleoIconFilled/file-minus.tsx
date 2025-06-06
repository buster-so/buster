import type { iconProps } from './iconProps';

function fileMinus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px file minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.428,2.867l-2.295-2.294c-.363-.364-.867-.573-1.382-.573h-3.001C2.233,0,1,1.233,1,2.75v3.25h3.75c1.24,0,2.25,1.009,2.25,2.25s-1.01,2.25-2.25,2.25H1.315c.457.886,1.371,1.5,2.435,1.5h4.5c1.517,0,2.75-1.233,2.75-2.75v-5.001c0-.521-.203-1.012-.572-1.382Zm-3.428,1.133V1.585c.024.016.051.027.071.048,0,0,0,0,0,0l2.294,2.293c.021.021.032.049.049.073h-2.415Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4.75,7.5H.75c-.414,0-.75.336-.75.75s.336.75.75.75h4c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default fileMinus;
