import type { iconProps } from './iconProps';

function circleDotsVertical(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle dots vertical';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path d="M8,9c0-.551,.449-1,1-1s1,.449,1,1-.449,1-1,1-1-.449-1-1Z" fill="currentColor" />
        <path d="M8,5.5c0-.551,.449-1,1-1s1,.449,1,1-.449,1-1,1-1-.449-1-1Z" fill="currentColor" />
        <path d="M8,12.5c0-.551,.449-1,1-1s1,.449,1,1-.449,1-1,1-1-.449-1-1Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default circleDotsVertical;
