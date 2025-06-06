import type { iconProps } from './iconProps';

function arrowTriangleLineMinimizeDiagonal2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow triangle line minimize diagonal 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.75,14.896v-3.896c0-.138,.112-.25,.25-.25h3.896c.223,0,.334,.269,.177,.427l-3.896,3.896c-.157,.157-.427,.046-.427-.177Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.125 13.125L15.25 15.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.104,7.25h3.896c.138,0,.25-.112,.25-.25V3.104c0-.223-.269-.334-.427-.177l-3.896,3.896c-.157,.157-.046,.427,.177,.427Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.875 4.875L2.75 2.75"
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

export default arrowTriangleLineMinimizeDiagonal2;
