import type { iconProps } from './iconProps';

function labelInfo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px label info';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="8" cy="6.75" fill="currentColor" r="1.25" strokeWidth="0" />
        <path
          d="m13.2094,7.002c-.0826-.4194-.2953-.8057-.6174-1.0969l-3.921-3.5471c-.381-.345-.961-.345-1.342,0l-3.921,3.5471c-.419.3789-.658.918-.658,1.4829v6.8621c0,1.105.895,2,2,2h3.0196"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m13.25,8.5c-2.6197,0-4.75,2.1303-4.75,4.75s2.1303,4.75,4.75,4.75,4.75-2.1303,4.75-4.75-2.1303-4.75-4.75-4.75Zm.75,7c0,.4141-.3359.75-.75.75s-.75-.3359-.75-.75v-2c0-.4141.3359-.75.75-.75s.75.3359.75.75v2Zm-.75-3.5c-.4832,0-.875-.3918-.875-.875s.3918-.875.875-.875.875.3917.875.875-.3918.875-.875.875Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default labelInfo;
