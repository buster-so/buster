import type { iconProps } from './iconProps';

function caretMaximizeDiagonal2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px caret maximize diagonal 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.25,9.354v4.646c0,.138-.112,.25-.25,.25h-4.646c-.223,0-.334-.269-.177-.427l4.646-4.646c.157-.157,.427-.046,.427,.177Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75,8.646V4c0-.138,.112-.25,.25-.25h4.646c.223,0,.334,.269,.177,.427l-4.646,4.646c-.157,.157-.427,.046-.427-.177Z"
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

export default caretMaximizeDiagonal2;
