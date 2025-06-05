import type { iconProps } from './iconProps';

function chevronUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chevron up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.53,4.72c-.293-.293-.768-.293-1.061,0L2.22,10.97c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l5.72-5.72,5.72,5.72c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-6.25-6.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chevronUp;
