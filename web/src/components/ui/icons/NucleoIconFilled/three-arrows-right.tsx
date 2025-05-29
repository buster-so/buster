import type { iconProps } from './iconProps';

function threeArrowsRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px three arrows right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,5h3.189l-.97,.97c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.25-2.25c.293-.293,.293-.768,0-1.061L6.03,1.47c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l.97,.97H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.78,8.47l-2.25-2.25c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l.97,.97H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H13.439l-.97,.97c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.25-2.25c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
        <path
          d="M9.03,10.97c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l.97,.97H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6.189l-.97,.97c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.25-2.25c.293-.293,.293-.768,0-1.061l-2.25-2.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default threeArrowsRight;
