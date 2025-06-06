import type { iconProps } from './iconProps';

function squareCaretDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square caret down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="12.5"
          width="12.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-180 9 9)"
          x="2.75"
          y="2.75"
        />
        <path
          d="M9.621,11.157l2.022-2.987c.337-.498-.02-1.17-.621-1.17H6.978c-.601,0-.958,.672-.621,1.17l2.022,2.987c.297,.439,.945,.439,1.242,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default squareCaretDown;
