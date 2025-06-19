import type { iconProps } from './iconProps';

function chart2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px chart 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.75,8c-.414,0-.75-.336-.75-.75V1.25c0-.414.336-.75.75-.75s.75.336.75.75v6c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4.75,11.5c-.414,0-.75-.336-.75-.75V1.25c0-.414.336-.75.75-.75s.75.336.75.75v9.5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m1.75,7c-.414,0-.75-.336-.75-.75V1.25c0-.414.336-.75.75-.75s.75.336.75.75v5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m7.75,5c-.414,0-.75-.336-.75-.75V1.25c0-.414.336-.75.75-.75s.75.336.75.75v3c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default chart2;
