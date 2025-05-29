import type { iconProps } from './iconProps';

function caretDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px caret down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m5.376,9.064l-3.099-4.648c-.332-.498.025-1.166.624-1.166h6.197c.599,0,.956.668.624,1.166l-3.099,4.648c-.297.445-.951.445-1.248,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default caretDown;
