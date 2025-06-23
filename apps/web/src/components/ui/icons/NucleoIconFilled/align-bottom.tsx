import type { iconProps } from './iconProps';

function alignBottom(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px align bottom';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.25,16H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h14.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <rect height="11" width="5" fill="currentColor" rx="1.75" ry="1.75" x="3" y="2" />
        <rect height="7" width="5" fill="currentColor" rx="1.75" ry="1.75" x="10" y="6" />
      </g>
    </svg>
  );
}

export default alignBottom;
