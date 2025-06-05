import type { iconProps } from './iconProps';

function redo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px redo';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m11.25,7.391c-.462-.403-2.362-1.97-5.25-1.97S1.212,6.988.75,7.391"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.828 3.539L11.25 7.391 7.286 8.461"
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

export default redo;
