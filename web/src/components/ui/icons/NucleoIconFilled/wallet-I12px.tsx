import type { iconProps } from './iconProps';

function wallet(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px wallet';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.25,5.5c-.414,0-.75-.336-.75-.75,0-1.517,1.233-2.75,2.75-2.75H12.75c.965,0,1.75,.785,1.75,1.75v.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-.5c0-.138-.112-.25-.25-.25H4.25c-.689,0-1.25,.561-1.25,1.25,0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.75,6H4.25c-.689,0-1.25-.561-1.25-1.25,0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V13.25c0,1.517,1.233,2.75,2.75,2.75H14.75c.965,0,1.75-.785,1.75-1.75V7.75c0-.965-.785-1.75-1.75-1.75Zm-2,6.25c-.689,0-1.25-.561-1.25-1.25s.561-1.25,1.25-1.25,1.25,.561,1.25,1.25-.561,1.25-1.25,1.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default wallet;
