import type { iconProps } from './iconProps';

function chair(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chair';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,6c-.414,0-.75,.336-.75,.75v3.577c-3.618-.741-7.382-.741-11,0v-3.577c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v4c0,1.517,1.233,2.75,2.75,2.75h3.5v2h-2.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2.5v-2h3.5c1.517,0,2.75-1.233,2.75-2.75V6.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M13.5,8.622V3.75c0-1.517-1.233-2.75-2.75-2.75h-3.5c-1.517,0-2.75,1.233-2.75,2.75v4.872c1.484-.233,2.989-.362,4.5-.362s3.016,.129,4.5,.362Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chair;
