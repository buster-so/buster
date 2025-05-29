import type { iconProps } from './iconProps';

function doubleChevronRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px double chevron right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.28,4.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l3.72,3.72-3.72,3.72c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l4.25-4.25c.293-.293,.293-.768,0-1.061l-4.25-4.25Z"
          fill="currentColor"
        />
        <path
          d="M9.78,8.47L5.53,4.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l3.72,3.72-3.72,3.72c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l4.25-4.25c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default doubleChevronRight;
