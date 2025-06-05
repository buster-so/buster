import type { iconProps } from './iconProps';

function caretLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px caret left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m2.936,5.376l4.648-3.099c.498-.332,1.166.025,1.166.624v6.197c0,.599-.668.956-1.166.624l-4.648-3.099c-.445-.297-.445-.951,0-1.248Z"
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

export default caretLeft;
