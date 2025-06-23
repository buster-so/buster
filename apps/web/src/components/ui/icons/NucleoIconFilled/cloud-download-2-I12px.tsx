import type { iconProps } from './iconProps';

function cloudDownload2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cloud download 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.146,4.327c-.442-2.463-2.611-4.327-5.146-4.327C6.105,0,3.75,2.355,3.75,5.25c0,.128,.005,.258,.017,.39-1.604,.431-2.767,1.885-2.767,3.61,0,2.068,1.682,3.75,3.75,3.75h3.5v-4.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4.25h2.75c2.481,0,4.5-2.019,4.5-4.5,0-1.854-1.15-3.503-2.854-4.173Z"
          fill="currentColor"
        />
        <path
          d="M10.72,14.47l-.97,.97v-2.439h-1.5v2.439l-.97-.97c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.25,2.25c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.25-2.25c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cloudDownload2;
