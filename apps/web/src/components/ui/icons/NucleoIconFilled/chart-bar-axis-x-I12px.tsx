import type { iconProps } from './iconProps';

function chartBarAxisX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart bar axis x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.25,14.5H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h14.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <rect height="11.5" width="4" fill="currentColor" rx="1.75" ry="1.75" x="7" y="2" />
        <rect height="7.5" width="4" fill="currentColor" rx="1.75" ry="1.75" x="2" y="6" />
        <rect height="4.5" width="4" fill="currentColor" rx="1.75" ry="1.75" x="12" y="9" />
      </g>
    </svg>
  );
}

export default chartBarAxisX;
