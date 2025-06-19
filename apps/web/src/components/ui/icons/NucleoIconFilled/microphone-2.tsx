import type { iconProps } from './iconProps';

function microphone2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px microphone 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4.25,7.5H13.75c.414,0,.75-.336,.75-.75v-.75c0-3.033-2.468-5.5-5.5-5.5S3.5,2.967,3.5,6v.75c0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,9H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.75c0,2.778,2.072,5.075,4.75,5.443v1.057c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.057c2.678-.368,4.75-2.665,4.75-5.443h.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default microphone2;
