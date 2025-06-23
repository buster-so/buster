import type { iconProps } from './iconProps';

function caretUpFromLine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px caret up from line';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.25 15.25L14.75 15.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.155,3.332L3.474,10.714c-.422,.666,.056,1.536,.845,1.536H13.682c.788,0,1.267-.87,.845-1.536L9.845,3.332c-.393-.619-1.296-.619-1.689,0Z"
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

export default caretUpFromLine;
