import type { iconProps } from './iconProps';

function cloudDroplet(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cloud droplet';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.146,6.327c-.442-2.463-2.611-4.327-5.146-4.327-2.895,0-5.25,2.355-5.25,5.25,0,.128,.005,.258,.017,.39-1.604,.431-2.767,1.885-2.767,3.61,0,2.068,1.682,3.75,3.75,3.75h.94c-.041-.211-.065-.429-.065-.652,0-1.679,.909-2.636,1.64-3.405l.266-.283c.375-.41,.911-.646,1.47-.646s1.095,.236,1.472,.647l.264,.281c.73,.769,1.64,1.727,1.64,3.405,0,.223-.024,.441-.065,.652h.19c2.481,0,4.5-2.019,4.5-4.5,0-1.854-1.15-3.503-2.854-4.173Z"
          fill="currentColor"
        />
        <path
          d="M9,16.25c1.036,0,1.875-.852,1.875-1.903,0-1.238-.771-1.868-1.51-2.674-.196-.213-.535-.213-.731,0-.739,.805-1.51,1.436-1.51,2.674,0,1.051,.839,1.903,1.875,1.903Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cloudDroplet;
