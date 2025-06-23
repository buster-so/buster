import type { iconProps } from './iconProps';

function liveOff(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px live off';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.995,12.005c-.769-.769-1.245-1.832-1.245-3.005,0-2.347,1.903-4.25,4.25-4.25,1.174,0,2.236,.476,3.005,1.245"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.132,8c.077,.321,.118,.656,.118,1,0,2.347-1.903,4.25-4.25,4.25-.344,0-.679-.041-1-.118"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 16L16 2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="9" cy="1.75" fill="currentColor" r=".75" />
        <circle cx="16.25" cy="9" fill="currentColor" r=".75" />
        <circle cx="14.127" cy="14.127" fill="currentColor" r=".75" />
        <circle cx="9" cy="16.25" fill="currentColor" r=".75" />
        <circle cx="1.75" cy="9" fill="currentColor" r=".75" />
        <circle cx="3.873" cy="3.873" fill="currentColor" r=".75" />
        <circle cx="11.774" cy="2.302" fill="currentColor" r=".75" />
        <circle cx="15.698" cy="6.226" fill="currentColor" r=".75" />
        <circle cx="15.698" cy="11.774" fill="currentColor" r=".75" />
        <circle cx="11.774" cy="15.698" fill="currentColor" r=".75" />
        <circle cx="6.226" cy="15.698" fill="currentColor" r=".75" />
        <circle cx="2.302" cy="11.774" fill="currentColor" r=".75" />
        <circle cx="2.302" cy="6.226" fill="currentColor" r=".75" />
        <circle cx="6.226" cy="2.302" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default liveOff;
