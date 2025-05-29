import type { iconProps } from './iconProps';

function mouseScrollDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px mouse scroll down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.78,11.72c-.293-.293-.768-.293-1.061,0l-.72,.72V3.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V12.439l-.72-.72c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2,2c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2-2c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
        <path
          d="M7.25,2h-2c-2.068,0-3.75,1.682-3.75,3.75v6.5c0,2.068,1.682,3.75,3.75,3.75h2c2.068,0,3.75-1.682,3.75-3.75V5.75c0-2.068-1.682-3.75-3.75-3.75Zm-.25,6.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default mouseScrollDown;
