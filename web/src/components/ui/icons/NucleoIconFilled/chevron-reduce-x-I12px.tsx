import type { iconProps } from './iconProps';

function chevronReduceX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chevron reduce x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.03,4.97c-.293-.293-.768-.293-1.061,0l-3.5,3.5c-.293,.293-.293,.768,0,1.061l3.5,3.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-2.97-2.97,2.97-2.97c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
        <path
          d="M4.03,4.97c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.97,2.97-2.97,2.97c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3.5-3.5c.293-.293,.293-.768,0-1.061l-3.5-3.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chevronReduceX;
