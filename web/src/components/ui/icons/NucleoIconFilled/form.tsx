import type { iconProps } from './iconProps';

function form(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px form';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="5" width="14" fill="currentColor" rx="1.75" ry="1.75" x="2" y="4.5" />
        <rect height="5" width="14" fill="currentColor" rx="1.75" ry="1.75" x="2" y="11" />
        <path
          d="M3.75,3H7.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default form;
