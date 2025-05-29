import type { iconProps } from './iconProps';

function bulletList(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bullet list';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.75,10.5h-7.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h7.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.75,14h-7.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h7.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.75,3.5h-7.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h7.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.75,7h-7.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h7.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <circle cx="3.75" cy="4.25" fill="currentColor" r="2.25" />
        <circle cx="3.75" cy="11.25" fill="currentColor" r="2.25" />
      </g>
    </svg>
  );
}

export default bulletList;
