import type { iconProps } from './iconProps';

function lipstick(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px lipstick';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.75,8.5c-.414,0-.75-.336-.75-.75V2.292l-2,1.143V7.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V3.29c0-.448,.242-.865,.631-1.086l2.499-1.428c.393-.223,.858-.221,1.247,.004,.391,.226,.623,.63,.623,1.082V7.75c0,.414-.336,.75-.75,.75ZM7.875,3.507h0Z"
          fill="currentColor"
        />
        <path
          d="M13,10.176v-1.426c0-.965-.785-1.75-1.75-1.75H6.75c-.965,0-1.75,.785-1.75,1.75v1.426c-.589,.282-1,.879-1,1.574v2.5c0,1.517,1.233,2.75,2.75,2.75h4.5c1.517,0,2.75-1.233,2.75-2.75v-2.5c0-.695-.411-1.292-1-1.574Zm-6.5-.176v-1.25c0-.138,.112-.25,.25-.25h4.5c.138,0,.25,.112,.25,.25v1.25H6.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default lipstick;
