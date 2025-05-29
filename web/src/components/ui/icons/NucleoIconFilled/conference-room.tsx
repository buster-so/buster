import type { iconProps } from './iconProps';

function conferenceRoom(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px conference room';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="15" width="8" fill="currentColor" rx="1.75" ry="1.75" x="5" y="1.5" />
        <circle cx="2.25" cy="9" fill="currentColor" r="1.25" />
        <circle cx="2.25" cy="4.25" fill="currentColor" r="1.25" />
        <circle cx="2.25" cy="13.75" fill="currentColor" r="1.25" />
        <circle cx="15.75" cy="9" fill="currentColor" r="1.25" />
        <circle cx="15.75" cy="4.25" fill="currentColor" r="1.25" />
        <circle cx="15.75" cy="13.75" fill="currentColor" r="1.25" />
      </g>
    </svg>
  );
}

export default conferenceRoom;
