import type { iconProps } from './iconProps';

function droplet(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px droplet';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.444,3.336c-.624-.65-1.269-1.322-1.86-2.057-.284-.354-.884-.354-1.168,0-.592,.734-1.237,1.407-1.86,2.057-1.957,2.04-3.806,3.966-3.806,7.397,0,3.456,2.804,6.267,6.25,6.267s6.25-2.812,6.25-6.267c0-3.431-1.849-5.357-3.806-7.397Zm-2.444,11.164c-2.068,0-3.75-1.69-3.75-3.767,0-.414,.336-.75,.75-.75s.75,.336,.75,.75c0,1.25,1.009,2.267,2.25,2.267,.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default droplet;
