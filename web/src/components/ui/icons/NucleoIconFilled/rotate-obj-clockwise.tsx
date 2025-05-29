import type { iconProps } from './iconProps';

function rotateObjClockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px rotate obj clockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="9" width="9" fill="currentColor" rx="2.25" ry="2.25" x="6" y="7" />
        <path
          d="M6.78,6.03l2.25-2.25c.293-.293,.293-.768,0-1.061L6.78,.47c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l.97,.97h-.439C3.631,2.5,1.5,4.631,1.5,7.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-1.792,1.458-3.25,3.25-3.25h.439l-.97,.97c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default rotateObjClockwise;
