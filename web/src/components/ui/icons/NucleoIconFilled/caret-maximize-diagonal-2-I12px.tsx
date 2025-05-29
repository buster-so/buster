import type { iconProps } from './iconProps';

function caretMaximizeDiagonal2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px caret maximize diagonal 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.57,3.617c-.156-.375-.519-.617-.924-.617H4c-.552,0-1,.449-1,1v4.646c0,.406,.242,.769,.618,.924,.124,.051,.255,.076,.383,.076,.261,0,.515-.102,.706-.293l4.647-4.647c.286-.287,.371-.715,.216-1.089Z"
          fill="currentColor"
        />
        <path
          d="M14.382,8.429c-.377-.156-.804-.068-1.089,.217l-4.647,4.647c-.286,.287-.371,.715-.216,1.089,.156,.375,.519,.617,.924,.617h4.646c.552,0,1-.449,1-1v-4.646c0-.406-.242-.769-.618-.924Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default caretMaximizeDiagonal2;
