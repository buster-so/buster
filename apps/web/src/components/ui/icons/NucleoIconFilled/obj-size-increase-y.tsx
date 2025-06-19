import type { iconProps } from './iconProps';

function objSizeIncreaseY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px obj size increase y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="6" width="16" fill="currentColor" rx="1.75" ry="1.75" x="1" y="6" />
        <path
          d="M7.28,4.28l1.72-1.72,1.72,1.72c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061L9.53,.97c-.293-.293-.768-.293-1.061,0l-2.25,2.25c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0Z"
          fill="currentColor"
        />
        <path
          d="M10.72,13.72l-1.72,1.72-1.72-1.72c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.25,2.25c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.25-2.25c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default objSizeIncreaseY;
