import type { iconProps } from './iconProps';

function borderWidth(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px border width';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.25,14H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h14.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <rect height="3.5" width="16" fill="currentColor" rx="1.25" ry="1.25" x="1" y="9" />
        <rect height="5.5" width="16" fill="currentColor" rx="1.25" ry="1.25" x="1" y="2" />
      </g>
    </svg>
  );
}

export default borderWidth;
