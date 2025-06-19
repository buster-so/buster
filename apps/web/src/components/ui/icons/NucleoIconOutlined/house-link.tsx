import type { iconProps } from './iconProps';

function houseLink(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house link';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.75,17.25h-.5c-.828,0-1.5-.672-1.5-1.5v-1c0-.828,.672-1.5,1.5-1.5h.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,17.25h.5c.828,0,1.5-.672,1.5-1.5v-1c0-.828-.672-1.5-1.5-1.5h-.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,10.75v-3.754c0-.312-.146-.607-.395-.796l-5.25-3.99c-.358-.272-.853-.272-1.21,0L3.145,6.2c-.249,.189-.395,.484-.395,.796v7.254c0,1.104,.895,2,2,2h3.551"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25 15.25L14.75 15.25"
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

export default houseLink;
