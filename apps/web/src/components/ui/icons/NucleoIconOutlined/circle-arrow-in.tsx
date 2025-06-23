import type { iconProps } from './iconProps';

function circleArrowIn(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle arrow in';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.953,5c1.298-1.958,3.522-3.25,6.047-3.25,4.004,0,7.25,3.246,7.25,7.25s-3.246,7.25-7.25,7.25c-2.526,0-4.749-1.291-6.047-3.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8 12.25L11.25 9 8 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 9L1.75 9"
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

export default circleArrowIn;
