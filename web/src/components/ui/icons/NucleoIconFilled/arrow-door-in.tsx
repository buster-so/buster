import type { iconProps } from './iconProps';

function arrowDoorIn(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow door in';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m5.78,5.47l-2.25-2.25c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l.97.97H.75c-.414,0-.75.336-.75.75s.336.75.75.75h2.689l-.97.97c-.293.293-.293.768,0,1.061.146.146.338.22.53.22s.384-.073.53-.22l2.25-2.25c.293-.293.293-.768,0-1.061Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9.75,0h-3.5c-1.094,0-2.024.783-2.212,1.862-.071.408.202.796.61.868.407.075.797-.202.868-.61.063-.359.372-.62.735-.62h2.929l-1.049.874c-.4.333-.63.823-.63,1.344v4.563c0,.521.229,1.011.63,1.344l1.049.874h-2.929c-.363,0-.672-.261-.735-.62-.071-.409-.461-.682-.868-.61-.408.071-.681.46-.61.868.188,1.079,1.119,1.862,2.212,1.862h3.5c1.241,0,2.25-1.009,2.25-2.25V2.25c0-1.241-1.009-2.25-2.25-2.25Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowDoorIn;
