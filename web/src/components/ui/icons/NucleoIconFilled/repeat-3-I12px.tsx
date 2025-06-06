import type { iconProps } from './iconProps';

function repeat3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px repeat 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,8c-.414,0-.75,.336-.75,.75v3c0,.689-.561,1.25-1.25,1.25H4.561l1.22-1.22c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-2.5,2.5c-.293,.293-.293,.768,0,1.061l2.5,2.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.22-1.22H13.25c1.517,0,2.75-1.233,2.75-2.75v-3c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M2.75,10c.414,0,.75-.336,.75-.75v-3c0-.689,.561-1.25,1.25-1.25H13.439l-1.22,1.22c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.5-2.5c.293-.293,.293-.768,0-1.061l-2.5-2.5c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.22,1.22H4.75c-1.517,0-2.75,1.233-2.75,2.75v3c0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default repeat3;
