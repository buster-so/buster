import type { iconProps } from './iconProps';

function suitHearts(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suit hearts';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,16.25c0-2.675,4.476-7.233,5.515-8.654s1.098-3.006-.27-4.195c-1.529-1.329-4.088-.561-5.245,1.717-1.157-2.279-3.715-3.046-5.245-1.717-1.368,1.189-1.31,2.774-.27,4.195s5.515,5.978,5.515,8.654Z"
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

export default suitHearts;
