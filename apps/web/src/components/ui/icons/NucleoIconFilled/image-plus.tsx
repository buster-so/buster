import type { iconProps } from './iconProps';

function imagePlus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px image plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m15.25,10.4395l-2.0557-2.0557c-1.0723-1.0723-2.8164-1.0723-3.8887,0l-6.0737,6.0747c-.012.012-.0233.0249-.0346.0378.3666.4558.9221.7537,1.5527.7537h8.5c1.1046,0,2-.8955,2-2v-2.8105Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m13.25,16H4.75c-1.5166,0-2.75-1.2334-2.75-2.75V4.75c0-1.5166,1.2334-2.75,2.75-2.75h4.7109c.4141,0,.75.3359.75.75s-.3359.75-.75.75h-4.7109c-.6895,0-1.25.5605-1.25,1.25v8.5c0,.6895.5605,1.25,1.25,1.25h8.5c.6895,0,1.25-.5605,1.25-1.25v-4.7109c0-.4141.3359-.75.75-.75s.75.3359.75.75v4.7109c0,1.5166-1.2334,2.75-2.75,2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m16.75,3h-1.75v-1.75c0-.4141-.3359-.75-.75-.75s-.75.3359-.75.75v1.75h-1.75c-.4141,0-.75.3359-.75.75s.3359.75.75.75h1.75v1.75c0,.4141.3359.75.75.75s.75-.3359.75-.75v-1.75h1.75c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <circle cx="6.25" cy="7.25" fill="currentColor" r="1.25" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default imagePlus;
