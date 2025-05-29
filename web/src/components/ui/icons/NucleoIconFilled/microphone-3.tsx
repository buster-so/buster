import type { iconProps } from './iconProps';

function microphone3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px microphone 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.25,8c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.75v-1.5h-1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.699c-.249-1.968-1.915-3.5-3.949-3.5-2.206,0-4,1.794-4,4v3.5c0,2.206,1.794,4,4,4,2.034,0,3.7-1.532,3.949-3.5h-1.699Z"
          fill="currentColor"
        />
        <path
          d="M16,7.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75c0,3.033-2.467,5.5-5.5,5.5S3.5,10.533,3.5,7.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75c0,3.606,2.742,6.583,6.25,6.958v2.042h-2.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2.5v-2.042c3.508-.376,6.25-3.352,6.25-6.958Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default microphone3;
