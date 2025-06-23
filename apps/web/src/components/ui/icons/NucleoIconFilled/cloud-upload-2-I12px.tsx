import type { iconProps } from './iconProps';

function cloudUpload2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cloud upload 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.146,5.827c-.442-2.463-2.611-4.327-5.146-4.327C6.105,1.5,3.75,3.855,3.75,6.75c0,.128,.005,.258,.017,.39-1.604,.431-2.767,1.885-2.767,3.61,0,2.068,1.682,3.75,3.75,3.75h3.5v-4.439l-.97,.97c-.293,.293-.768,.293-1.061,0s-.293-.768,0-1.061l2.25-2.25c.293-.293,.768-.293,1.061,0l2.25,2.25c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22l-.97-.97v4.439h2.75c2.481,0,4.5-2.019,4.5-4.5,0-1.854-1.15-3.503-2.854-4.173Z"
          fill="currentColor"
        />
        <path
          d="M8.25,14.5v2.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.75h-1.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cloudUpload2;
