import type { iconProps } from './iconProps';

function caretReduceY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px caret reduce y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m5.8,4.135L3.552,1.15c-.124-.165-.007-.4.2-.4h4.497c.206,0,.324.236.2.4l-2.249,2.985c-.1.133-.299.133-.399,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m5.8,7.865l-2.249,2.985c-.124.165-.007.4.2.4h4.497c.206,0,.324-.236.2-.4l-2.249-2.985c-.1-.133-.299-.133-.399,0Z"
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

export default caretReduceY;
