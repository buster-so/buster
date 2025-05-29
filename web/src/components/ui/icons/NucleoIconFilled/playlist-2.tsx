import type { iconProps } from './iconProps';

function playlist2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px playlist 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.75,2h-3.5c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h3.5c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-.035,7.518l-2.308,1.385c-.403,.242-.916-.048-.916-.519v-2.771c0-.47,.513-.76,.916-.519l2.308,1.385c.391,.235,.391,.802,0,1.037Z"
          fill="currentColor"
        />
        <path
          d="M3,14.5h-.25c-1.241,0-2.25-1.009-2.25-2.25V5.75c0-1.241,1.009-2.25,2.25-2.25h.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-.25c-.414,0-.75,.336-.75,.75v6.5c0,.414,.336,.75,.75,.75h.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,14.5h-.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h.25c.414,0,.75-.336,.75-.75V5.75c0-.414-.336-.75-.75-.75h-.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h.25c1.241,0,2.25,1.009,2.25,2.25v6.5c0,1.241-1.009,2.25-2.25,2.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default playlist2;
