import type { iconProps } from './iconProps';

function globe2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px globe 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.25,5.25h-2.351c-.154-2.717-1.141-5.25-2.899-5.25s-2.745,2.533-2.899,5.25H.75c-.414,0-.75.336-.75.75s.336.75.75.75h2.351c.154,2.717,1.141,5.25,2.899,5.25s2.745-2.533,2.899-5.25h2.351c.414,0,.75-.336.75-.75s-.336-.75-.75-.75ZM6,1.5c.387,0,1.24,1.283,1.391,3.75h-2.782c.151-2.467,1.004-3.75,1.391-3.75Zm0,9c-.387,0-1.24-1.283-1.391-3.75h2.782c-.151,2.467-1.004,3.75-1.391,3.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6,12c-3.309,0-6-2.691-6-6S2.691,0,6,0s6,2.691,6,6-2.691,6-6,6Zm0-10.5C3.519,1.5,1.5,3.519,1.5,6s2.019,4.5,4.5,4.5,4.5-2.019,4.5-4.5S8.481,1.5,6,1.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default globe2;
