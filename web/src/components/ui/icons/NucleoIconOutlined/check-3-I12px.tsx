import type { iconProps } from './iconProps';

function check3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px check 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m1.75,6c1.047,1.048,1.803,2.153,2.461,3.579,1.524-3.076,3.659-5.397,6.039-7.158"
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

export default check3;
