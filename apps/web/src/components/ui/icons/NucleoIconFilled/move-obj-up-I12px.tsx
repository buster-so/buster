import type { iconProps } from './iconProps';

function moveObjUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px move obj up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.28,6.03l1.97-1.97v5.689c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V4.061l1.97,1.97c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-3.25-3.25c-.293-.293-.768-.293-1.061,0l-3.25,3.25c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0Z"
          fill="currentColor"
        />
        <rect height="4.5" width="14" fill="currentColor" rx="1.75" ry="1.75" x="2" y="12" />
      </g>
    </svg>
  );
}

export default moveObjUp;
