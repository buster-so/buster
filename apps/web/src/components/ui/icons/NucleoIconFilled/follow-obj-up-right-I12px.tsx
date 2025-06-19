import type { iconProps } from './iconProps';

function followObjUpRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px follow obj up right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.75,9.5H3.239c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.7l-3.72,3.72c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3.72-3.72v2.7c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-4.51c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <rect height="7" width="7" fill="currentColor" rx="1.75" ry="1.75" x="9" y="2" />
      </g>
    </svg>
  );
}

export default followObjUpRight;
