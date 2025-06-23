import type { iconProps } from './iconProps';

function gridList(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px grid list';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,3h-5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,6h-5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,10.5h-5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,13.5h-5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <rect height="6" width="6" fill="currentColor" rx="1.75" ry="1.75" x="2" y="2" />
        <rect height="6" width="6" fill="currentColor" rx="1.75" ry="1.75" x="2" y="10" />
      </g>
    </svg>
  );
}

export default gridList;
