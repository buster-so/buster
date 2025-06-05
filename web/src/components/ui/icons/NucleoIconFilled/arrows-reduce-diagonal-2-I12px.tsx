import type { iconProps } from './iconProps';

function arrowsReduceDiagonal2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrows reduce diagonal 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.561,11.5h2.689c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-4.5c-.414,0-.75,.336-.75,.75v4.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.689l3.22,3.22c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-3.22-3.22Z"
          fill="currentColor"
        />
        <path
          d="M7.25,2c-.414,0-.75,.336-.75,.75v2.689L3.28,2.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l3.22,3.22H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H7.25c.414,0,.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowsReduceDiagonal2;
