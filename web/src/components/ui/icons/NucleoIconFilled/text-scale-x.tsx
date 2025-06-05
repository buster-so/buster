import type { iconProps } from './iconProps';

function textScaleX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text scale x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,1H4.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.5V11.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.5h3.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M16.78,13.72l-2-2c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l.72,.72H3.561l.72-.72c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-2,2c-.293,.293-.293,.768,0,1.061l2,2c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-.72-.72H14.439l-.72,.72c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2-2c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default textScaleX;
