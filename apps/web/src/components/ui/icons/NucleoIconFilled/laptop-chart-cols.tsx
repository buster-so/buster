import type { iconProps } from './iconProps';

function laptopChartCols(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px laptop chart cols';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,11.75c-.414,0-.75-.336-.75-.75v-3c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M6.25,11.75c-.414,0-.75-.336-.75-.75v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,11.75c-.414,0-.75-.336-.75-.75V6.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.75,15.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75c.689,0,1.25-.561,1.25-1.25V4.75c0-.689-.561-1.25-1.25-1.25H4.25c-.689,0-1.25,.561-1.25,1.25V12.75c0,.689,.561,1.25,1.25,1.25,.414,0,.75,.336,.75,.75s-.336,.75-.75,.75c-1.517,0-2.75-1.233-2.75-2.75V4.75c0-1.517,1.233-2.75,2.75-2.75H13.75c1.517,0,2.75,1.233,2.75,2.75V12.75c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
        />
        <path
          d="M17.25,15.5H.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H17.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default laptopChartCols;
