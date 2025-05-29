import type { iconProps } from './iconProps';

function seedling(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px seedling';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m8.5,8.051c1.597-.525,2.75-2.028,2.75-3.801v-.5h-1.75c-1.933,0-3.5,1.567-3.5,3.5v1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6 11.25L6 6.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m.75,1.75h1.75c1.932,0,3.5,1.568,3.5,3.5v1h-1.25c-2.208,0-4-1.792-4-4v-.5h0Z"
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

export default seedling;
