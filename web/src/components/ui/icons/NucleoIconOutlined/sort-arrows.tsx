import type { iconProps } from './iconProps';

function sortArrows(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sort arrows';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.627,2.416l-3.132,3.5c-.288,.322-.06,.833,.373,.833h6.263c.432,0,.661-.511,.373-.833l-3.132-3.5c-.199-.222-.546-.222-.745,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.627,15.584l-3.132-3.5c-.288-.322-.06-.833,.373-.833h6.263c.432,0,.661,.511,.373,.833l-3.132,3.5c-.199,.222-.546,.222-.745,0Z"
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

export default sortArrows;
