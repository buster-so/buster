import type { iconProps } from './iconProps';

function stack(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px stack';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="16" width="11.5" fill="currentColor" rx="1.75" ry="1.75" x="2" y="1" />
        <path
          d="M15.75,3.5c-.414,0-.75,.336-.75,.75V13.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V4.25c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default stack;
