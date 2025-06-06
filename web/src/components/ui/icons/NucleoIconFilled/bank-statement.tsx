import type { iconProps } from './iconProps';

function bankStatement(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bank statement';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M7.5 7H8.25V9.5H7.5z" fill="currentColor" />
        <path d="M9.75 7H10.5V9.5H9.75z" fill="currentColor" />
        <path
          d="M13.25,1H4.75c-1.517,0-2.75,1.233-2.75,2.75V14.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V3.75c0-1.517-1.233-2.75-2.75-2.75Zm-1,13H5.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm.75-8.25c0,.601-.434,1.08-1,1.199v2.551h.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H5.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h.25v-2.551c-.566-.119-1-.599-1-1.199v-.157c0-.513,.322-.982,.801-1.167l2.75-1.058c.29-.111,.609-.111,.898,0l2.75,1.058c.479,.185,.801,.653,.801,1.167v.157Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bankStatement;
