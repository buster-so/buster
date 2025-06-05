import type { iconProps } from './iconProps';

function tableRows2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px table rows 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.5,5.25v-2c0-1.517-1.233-2.75-2.75-2.75H3.25C1.733.5.5,1.733.5,3.25v2h11Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m.5,6.75v2c0,1.517,1.233,2.75,2.75,2.75h5.5c1.517,0,2.75-1.233,2.75-2.75v-2H.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default tableRows2;
