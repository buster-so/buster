import type { iconProps } from './iconProps';

function circleLock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle lock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm.75,9.362v2.138c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.138c-.872-.31-1.5-1.134-1.5-2.112,0-1.243,1.007-2.25,2.25-2.25s2.25,1.007,2.25,2.25c0,.978-.628,1.802-1.5,2.112Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleLock;
