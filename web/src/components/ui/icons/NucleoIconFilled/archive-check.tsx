import type { iconProps } from './iconProps';

function archiveCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px archive check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m12.8594,7c-.1895,0-.3721-.0713-.5117-.2012l-1.6094-1.5c-.3027-.2827-.3193-.7573-.0371-1.0601.2822-.3042.7588-.3193,1.0605-.0376l1,.9331,2.8965-3.8364c.248-.3296.7178-.3965,1.0508-.1465.3301.2495.3965.7197.1465,1.0508l-3.3975,4.5c-.1279.1694-.3223.2764-.5332.2949-.0225.002-.0439.0029-.0654.0029Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m15.25,6.4824c-.4141,0-.75.3359-.75.75v2.2676h-2.75c-.4141,0-.75.3359-.75.75v1.5c0,.1377-.1123.25-.25.25h-3.5c-.1377,0-.25-.1123-.25-.25v-1.5c0-.4141-.3359-.75-.75-.75h-2.75v-4.75c0-.6895.5605-1.25,1.25-1.25h5c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75h-5c-1.5166,0-2.75,1.2334-2.75,2.75v8.5c0,1.5166,1.2334,2.75,2.75,2.75h8.5c1.5166,0,2.75-1.2334,2.75-2.75v-6.0176c0-.4141-.3359-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default archiveCheck;
