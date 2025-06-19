import type { iconProps } from './iconProps';

function pinMinus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pin minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.5 7.75L6.5 7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.779,7.266c0,2.622-3.428,6.833-5.004,8.631-.413,.471-1.139,.471-1.551,0-1.576-1.797-5.004-6.008-5.004-8.631C3.221,3.776,6.207,1.75,9,1.75s5.779,2.026,5.779,5.516Z"
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

export default pinMinus;
