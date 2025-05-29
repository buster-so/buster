import type { iconProps } from './iconProps';

function pin(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px pin';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,0C3.575,0,1.065,1.774,1.064,4.744c0,2.089,2.388,5.123,3.809,6.743.284.326.694.513,1.125.513h.002c.431,0,.841-.187,1.125-.511,1.738-1.982,3.811-4.761,3.811-6.745C10.936,1.774,8.426,0,6,0Zm0,6c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default pin;
