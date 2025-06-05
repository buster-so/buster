import type { iconProps } from './iconProps';

function caretRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px caret right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.209,8.155L6.286,3.131c-.666-.422-1.536,.056-1.536,.845V14.025c0,.788,.87,1.267,1.536,.845l7.923-5.025c.619-.393,.619-1.296,0-1.689Z"
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

export default caretRight;
