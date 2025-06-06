import type { iconProps } from './iconProps';

function arrowsFromLineX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrows from line x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,2c-.414,0-.75,.336-.75,.75V15.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M6.25,8.25H3.561l1.22-1.22c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-2.5,2.5c-.293,.293-.293,.768,0,1.061l2.5,2.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.22-1.22h2.689c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M14.28,5.97c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.22,1.22h-2.689c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.689l-1.22,1.22c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.5-2.5c.293-.293,.293-.768,0-1.061l-2.5-2.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowsFromLineX;
