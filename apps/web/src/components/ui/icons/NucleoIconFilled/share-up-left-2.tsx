import type { iconProps } from './iconProps';

function shareUpLeft2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px share up left 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.75,11.5h-4c-1.517,0-2.75-1.233-2.75-2.75v-2.465c0-.414.336-.75.75-.75s.75.336.75.75v2.465c0,.689.561,1.25,1.25,1.25h4c.689,0,1.25-.561,1.25-1.25v-4c0-.689-.561-1.25-1.25-1.25h-2.465c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h2.465c1.517,0,2.75,1.233,2.75,2.75v4c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m2.561,1.5h1.939c.414,0,.75-.336.75-.75s-.336-.75-.75-.75H.75c-.414,0-.75.336-.75.75v3.75c0,.414.336.75.75.75s.75-.336.75-.75v-1.939l4.702,4.702c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061L2.561,1.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default shareUpLeft2;
