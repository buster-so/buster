import type { iconProps } from './iconProps';

function unorderedList(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px unordered list';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="3.75" cy="5.25" fill="currentColor" r="2.25" />
        <circle cx="3.75" cy="12.75" fill="currentColor" r="2.25" />
        <path
          d="M16.25,6h-7.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h7.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,13.5h-7.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h7.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default unorderedList;
