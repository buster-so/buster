import type { iconProps } from './iconProps';

function treePalm(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px tree palm';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 5.489L10 13"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,5.489c-1.61-.814-3.596-.777-5.216,.279s-2.457,2.858-2.362,4.659l7.578-4.938Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,5.489c1.61-.814,3.596-.777,5.216,.279s2.457,2.858,2.362,4.659l-7.578-4.938Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,5.489c-.178-1.454-1.101-2.776-2.545-3.392s-3.037-.366-4.21,.512l6.755,2.88Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,5.489c.178-1.454,1.101-2.776,2.545-3.392,1.444-.616,3.037-.366,4.21,.512l-6.755,2.88Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.329,16.25c-.998-1.929-3.007-3.25-5.329-3.25s-4.331,1.321-5.329,3.25H15.329Z"
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

export default treePalm;
