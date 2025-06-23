import type { iconProps } from './iconProps';

function bracketsSquareDots(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px brackets square dots';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6,16H3.75c-.965,0-1.75-.785-1.75-1.75V3.75c0-.965,.785-1.75,1.75-1.75h2.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H3.75c-.138,0-.25,.112-.25,.25V14.25c0,.138,.112,.25,.25,.25h2.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,16h-2.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.25c.138,0,.25-.112,.25-.25V3.75c0-.138-.112-.25-.25-.25h-2.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.25c.965,0,1.75,.785,1.75,1.75V14.25c0,.965-.785,1.75-1.75,1.75Z"
          fill="currentColor"
        />
        <circle cx="9" cy="12.25" fill="currentColor" r=".75" />
        <circle cx="11.75" cy="12.25" fill="currentColor" r=".75" />
        <circle cx="6.25" cy="12.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default bracketsSquareDots;
