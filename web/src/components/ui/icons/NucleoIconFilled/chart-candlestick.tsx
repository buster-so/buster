import type { iconProps } from './iconProps';

function chartCandlestick(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart candlestick';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4.25,5h-.25V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v3.25h-.25c-.689,0-1.25,.561-1.25,1.25v3.5c0,.689,.561,1.25,1.25,1.25h.25v2.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.25h.25c.689,0,1.25-.561,1.25-1.25v-3.5c0-.689-.561-1.25-1.25-1.25Z"
          fill="currentColor"
        />
        <path
          d="M10,6.5h-.25v-1.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.25h-.25c-.689,0-1.25,.561-1.25,1.25v4c0,.689,.561,1.25,1.25,1.25h.25v3.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.5h.25c.689,0,1.25-.561,1.25-1.25V7.75c0-.689-.561-1.25-1.25-1.25Z"
          fill="currentColor"
        />
        <path
          d="M15.75,2h-2c-.689,0-1.25,.561-1.25,1.25v7.5c0,.689,.561,1.25,1.25,1.25h.25v2.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.25h.25c.689,0,1.25-.561,1.25-1.25V3.25c0-.689-.561-1.25-1.25-1.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chartCandlestick;
