import type { iconProps } from './iconProps';

function file(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px file';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.428,2.867l-2.295-2.294c-.363-.364-.867-.573-1.382-.573h-3.001C2.233,0,1,1.233,1,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75h4.5c1.517,0,2.75-1.233,2.75-2.75v-5.001c0-.521-.203-1.012-.572-1.382Zm-3.355-1.233l2.294,2.293c.021.021.032.049.049.073h-2.415V1.585c.024.016.051.027.071.048,0,0,0,0,0,0Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default file;
