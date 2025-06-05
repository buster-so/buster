import type { iconProps } from './iconProps';

function creditCardSignal(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px credit card signal';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17,5.75c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v.75H17v-.75Z"
          fill="currentColor"
        />
        <path
          d="M14.156,8H1v4.25c0,1.517,1.233,2.75,2.75,2.75h4.814c.383-3.248,2.604-5.934,5.591-7Zm-6.906,4h-3c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M17,10.5h.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-.25c-3.859,0-7,3.14-7,7v.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.25c0-3.033,2.468-5.5,5.5-5.5Z"
          fill="currentColor"
        />
        <path
          d="M17.25,12h-.25c-2.206,0-4,1.794-4,4v.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.25c0-1.378,1.121-2.5,2.5-2.5h.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <circle cx="17" cy="16" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default creditCardSignal;
