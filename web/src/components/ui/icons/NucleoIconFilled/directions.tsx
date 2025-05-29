import type { iconProps } from './iconProps';

function directions(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px directions';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.25,15.5h-2.5V1.75c0-.414-.336-.75-.75-.75H3.884c-.434,0-.85,.16-1.171,.449l-1.389,1.25c-.368,.331-.579,.805-.579,1.301s.211,.97,.579,1.301l1.389,1.25c.321,.29,.737,.45,1.171,.45h4.366V15.5h-2.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M16.671,7.199l-1.389-1.25c-.321-.29-.737-.45-1.171-.45h-2.366c-.414,0-.75,.336-.75,.75v4.5c0,.414,.336,.75,.75,.75h2.366c.434,0,.85-.16,1.171-.449l1.389-1.25c.368-.331,.579-.805,.579-1.301s-.211-.97-.579-1.301Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default directions;
