import type { iconProps } from './iconProps';

function arrowTriangleLineExpandDiagonal4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow triangle line expand diagonal 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.125 5.125L12.875 12.875"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,11.104v3.896c0,.138-.112,.25-.25,.25h-3.896c-.223,0-.334-.269-.177-.427l3.896-3.896c.157-.157,.427-.046,.427,.177Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.896,2.75H3c-.138,0-.25,.112-.25,.25v3.896c0,.223,.269,.334,.427,.177l3.896-3.896c.157-.157,.046-.427-.177-.427Z"
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

export default arrowTriangleLineExpandDiagonal4;
