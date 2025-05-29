import type { iconProps } from './iconProps';

function section(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px section';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="8" width="16" fill="currentColor" rx="2.75" ry="2.75" x="1" y="5" />
        <path
          d="M14.25,15H3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H14.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M3.75,3H14.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default section;
