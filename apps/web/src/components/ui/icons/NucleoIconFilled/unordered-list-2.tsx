import type { iconProps } from './iconProps';

function unorderedList2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px unordered list 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="1.5" cy="1.75" fill="currentColor" r="1.5" strokeWidth="0" />
        <circle cx="1.5" cy="6" fill="currentColor" r="1.5" strokeWidth="0" />
        <circle cx="1.5" cy="10.25" fill="currentColor" r="1.5" strokeWidth="0" />
        <path
          d="m11.25,1h-6.25c-.414,0-.75.336-.75.75s.336.75.75.75h6.25c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.25,5.25h-6.25c-.414,0-.75.336-.75.75s.336.75.75.75h6.25c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.25,9.5h-6.25c-.414,0-.75.336-.75.75s.336.75.75.75h6.25c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default unorderedList2;
