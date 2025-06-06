import type { iconProps } from './iconProps';

function moveToTop(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px move to top';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="7" width="14" fill="currentColor" rx="2.75" ry="2.75" x="2" y="1" />
        <path
          d="M2.75,13c.414,0,.75-.336,.75-.75s.336-.75,.75-.75h.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-.75c-1.241,0-2.25,1.009-2.25,2.25,0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M7.75,11.5h2.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.75,10h-.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.75c.414,0,.75,.336,.75,.75s.336,.75,.75,.75,.75-.336,.75-.75c0-1.241-1.009-2.25-2.25-2.25Z"
          fill="currentColor"
        />
        <path
          d="M4.25,17h.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-.75c-.414,0-.75-.336-.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75c0,1.241,1.009,2.25,2.25,2.25Z"
          fill="currentColor"
        />
        <path
          d="M7.75,17h2.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,14c-.414,0-.75,.336-.75,.75s-.336,.75-.75,.75h-.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.75c1.241,0,2.25-1.009,2.25-2.25,0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default moveToTop;
