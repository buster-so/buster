import type { iconProps } from './iconProps';

function arrowsCross(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrows cross';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,10c-.414,0-.75,.336-.75,.75v2.689l-2.97-2.97c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.97,2.97h-2.689c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.5c.414,0,.75-.336,.75-.75v-4.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M6.47,7.53c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061L3.28,2.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061L6.47,7.53Z"
          fill="currentColor"
        />
        <path
          d="M15.25,2h-4.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.689L2.22,14.72c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22L14.5,4.561v2.689c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowsCross;
