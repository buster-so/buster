import type { iconProps } from './iconProps';

function stringEndsWith(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px string ends with';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m1.984,6.484c.486-.523,1.178-.734,1.881-.734h0c1.179,0,2.134.956,2.134,2.134v3.616"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m6,8.75c0,1.518-1.232,2.75-2.75,2.75h-.1614c-.7393,0-1.3386-.5993-1.3386-1.3386h0c0-.6436.458-1.1961,1.0904-1.3154l2.2773-.3999c.5385-.1016.8899-.6151.8012-1.1462"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 2.75L9 11.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.75,14.75h13c1.1046,0,2-.8954,2-2v-1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <ellipse
          cx="11.25"
          cy="8.75"
          fill="none"
          rx="2.25"
          ry="2.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default stringEndsWith;
