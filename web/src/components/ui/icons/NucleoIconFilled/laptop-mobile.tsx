import type { iconProps } from './iconProps';

function laptopMobile(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px laptop mobile';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="10" width="7" fill="currentColor" rx="2.25" ry="2.25" x="10" y="7" />
        <path
          d="M8,12.25h-3.375c-.62,0-1.125-.505-1.125-1.125V4.75c0-.689,.561-1.25,1.25-1.25H13.25c.689,0,1.25,.561,1.25,1.25v.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.25c0-1.517-1.233-2.75-2.75-2.75H4.75c-1.517,0-2.75,1.233-2.75,2.75v6.375c0,.404,.099,.783,.263,1.125h-.513c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default laptopMobile;
