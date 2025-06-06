import type { iconProps } from './iconProps';

function diagramGantt(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px diagram gantt';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.25,14.5h-2c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M11,7.25c0-.414-.336-.75-.75-.75H3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6.5c.414,0,.75-.336,.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15,11.25c0-.414-.336-.75-.75-.75H7.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6.5c.414,0,.75-.336,.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M4.5,3.25c0-.414-.336-.75-.75-.75H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H3.75c.414,0,.75-.336,.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default diagramGantt;
