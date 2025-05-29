import type { iconProps } from './iconProps';

function followObjDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px follow obj down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.47,9.78c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3.25-3.25c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-1.97,1.97V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V7.439l-1.97-1.97c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l3.25,3.25Z"
          fill="currentColor"
        />
        <rect height="4.5" width="14" fill="currentColor" rx="1.75" ry="1.75" x="2" y="11.5" />
      </g>
    </svg>
  );
}

export default followObjDown;
