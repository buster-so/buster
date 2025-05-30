import type { iconProps } from './iconProps';

function caretMinimizeDiagonal2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px caret minimize diagonal 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.883,1.93c-.375-.157-.803-.07-1.09,.217L2.146,6.793c-.287,.287-.372,.715-.217,1.09s.518,.617,.924,.617H7.5c.551,0,1-.449,1-1V2.854c0-.406-.242-.769-.617-.924Z"
          fill="currentColor"
        />
        <path
          d="M15.146,9.5h-4.646c-.551,0-1,.449-1,1v4.646c0,.406,.242,.769,.617,.924,.125,.052,.255,.077,.384,.077,.26,0,.514-.102,.706-.293l4.646-4.646c.287-.287,.372-.715,.217-1.09s-.518-.617-.924-.617Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default caretMinimizeDiagonal2;
