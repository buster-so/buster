import type { iconProps } from './iconProps';

function scrollY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px scroll y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="9" fill="currentColor" r="3" />
        <path
          d="M6.78,4.78l2.22-2.22,2.22,2.22c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061L9.53,.97c-.293-.293-.768-.293-1.061,0l-2.75,2.75c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0Z"
          fill="currentColor"
        />
        <path
          d="M11.22,13.22l-2.22,2.22-2.22-2.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.75,2.75c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.75-2.75c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default scrollY;
