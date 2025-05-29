import type { iconProps } from './iconProps';

function followObjUpLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px follow obj up left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.061,11h2.7c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-4.511c-.414,0-.75,.336-.75,.75v4.51c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.7l3.72,3.72c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-3.72-3.72Z"
          fill="currentColor"
        />
        <rect height="7" width="7" fill="currentColor" rx="1.75" ry="1.75" x="2" y="2" />
      </g>
    </svg>
  );
}

export default followObjUpLeft;
