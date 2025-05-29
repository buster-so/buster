import type { iconProps } from './iconProps';

function spoon(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px spoon';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,16.5c-.414,0-.75-.336-.75-.75v-6.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,9.75c-1.861,0-3.375-1.851-3.375-4.125S7.139,1.5,9,1.5s3.375,1.851,3.375,4.125-1.514,4.125-3.375,4.125Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default spoon;
