import type { iconProps } from './iconProps';

function squareChartLock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square chart lock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.25,9.5c-1.792,0-3.25-1.458-3.25-3.25v-1.5c0-.865,.354-1.661,.926-2.25H2.75C1.233,2.5,0,3.733,0,5.25V13.75c0,1.517,1.233,2.75,2.75,2.75H11.25c1.517,0,2.75-1.233,2.75-2.75v-4.25h-1.75Zm-7.75,3.25c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-4.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4.25Zm3.25,0c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V6.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5Zm3.25,0c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2Z"
          fill="currentColor"
        />
        <path
          d="M16.5,3.025v-.775c0-1.241-1.009-2.25-2.25-2.25s-2.25,1.009-2.25,2.25v.775c-.846,.123-1.5,.845-1.5,1.725v1.5c0,.965,.785,1.75,1.75,1.75h4c.965,0,1.75-.785,1.75-1.75v-1.5c0-.879-.654-1.602-1.5-1.725Zm-2.25-1.525c.414,0,.75,.336,.75,.75v.75h-1.5v-.75c0-.414,.336-.75,.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default squareChartLock;
