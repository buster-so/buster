import type { iconProps } from './iconProps';

function lightbulb2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px lightbulb 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 11.25L9 8.25 7 6.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 8.25L11 6.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75 13.75L11.25 13.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14,6.75c0-3.113-2.846-5.562-6.078-4.887-1.932,.403-3.475,1.993-3.834,3.933-.434,2.344,.771,4.459,2.662,5.415v3.039c0,1.105,.895,2,2,2h.5c1.105,0,2-.895,2-2v-3.039c1.63-.824,2.75-2.51,2.75-4.461Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75 11.25L11.25 11.25"
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

export default lightbulb2;
