import type { iconProps } from './iconProps';

function houseShield(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house shield';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.25,8.38v-1.384c0-.312-.146-.607-.395-.796l-5.25-3.99c-.358-.272-.853-.272-1.21,0L3.145,6.2c-.249,.189-.395,.484-.395,.796v7.254c0,1.104,.895,2,2,2h4.754"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.5,10.75l2.75,1.25v2.94c0,1.54-2.75,2.31-2.75,2.31,0,0-2.75-.77-2.75-2.31v-2.94l2.75-1.25Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default houseShield;
