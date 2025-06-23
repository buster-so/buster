import type { iconProps } from './iconProps';

function creditCard(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px credit card';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m12,4v-.25c0-1.517-1.233-2.75-2.75-2.75H2.75C1.233,1,0,2.233,0,3.75v.25h12Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m0,5.5v2.75c0,1.517,1.233,2.75,2.75,2.75h6.5c1.517,0,2.75-1.233,2.75-2.75v-2.75H0Zm9.25,3.5h-2c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h2c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default creditCard;
