import type { iconProps } from './iconProps';

function resizeY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px resize y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,15H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H15.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M6.22,11.28l2.25,2.25c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.25-2.25c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-1.72,1.72-1.72-1.72c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061Z"
          fill="currentColor"
        />
        <path
          d="M15.25,1.5H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H15.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M7.28,7.78l1.72-1.72,1.72,1.72c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-2.25-2.25c-.293-.293-.768-.293-1.061,0l-2.25,2.25c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default resizeY;
