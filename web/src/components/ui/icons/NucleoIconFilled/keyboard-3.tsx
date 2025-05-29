import type { iconProps } from './iconProps';

function keyboard3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px keyboard 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="2" width="2" fill="currentColor" rx=".75" ry=".75" x="4.5" y="8.5" />
        <rect height="2" width="2" fill="currentColor" rx=".75" ry=".75" x="1" y="8.5" />
        <rect height="2" width="2" fill="currentColor" rx=".75" ry=".75" x="8" y="8.5" />
        <rect height="2" width="2" fill="currentColor" rx=".75" ry=".75" x="11.5" y="8.5" />
        <rect height="2" width="2" fill="currentColor" rx=".75" ry=".75" x="6.25" y="5" />
        <rect height="2" width="2" fill="currentColor" rx=".75" ry=".75" x="2.75" y="5" />
        <rect height="2" width="2" fill="currentColor" rx=".75" ry=".75" x="9.75" y="5" />
        <rect height="2" width="2" fill="currentColor" rx=".75" ry=".75" x="13.25" y="5" />
        <rect height="2" width="2" fill="currentColor" rx=".75" ry=".75" x="15" y="8.5" />
        <path
          d="M13.5,13.5H4.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H13.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default keyboard3;
