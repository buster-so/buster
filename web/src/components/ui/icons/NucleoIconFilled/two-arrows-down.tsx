import type { iconProps } from './iconProps';

function twoArrowsDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px two arrows down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.72,11.72l-1.72,1.72V2.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V13.439l-1.72-1.72c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l3,3c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3-3c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
        <path
          d="M14.72,7.22l-1.72,1.72V2.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v6.189l-1.72-1.72c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l3,3c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3-3c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default twoArrowsDown;
