import type { iconProps } from './iconProps';

function audioDescription(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px audio description';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m12,6h-1v3.5h1c.5513,0,1-.4487,1-1v-1.5c0-.5513-.4487-1-1-1Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="M5.6019 8.5L6.899 8.5 6.251 6.2637 5.6019 8.5z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m14.25,1.5H3.75c-1.517,0-2.75,1.2329-2.75,2.75v7c0,1.5171,1.233,2.75,2.75,2.75h1.25v2.25c0,.2881.165.551.425.676.103.05.2141.074.325.074.167,0,.333-.0562.469-.165l3.544-2.835h4.487c1.517,0,2.75-1.2329,2.75-2.75v-7c0-1.5171-1.233-2.75-2.75-2.75Zm-5.854,9.4702c-.0698.0205-.1401.0298-.2095.0298-.3252,0-.625-.2129-.7197-.541l-.133-.459h-2.1674l-.1332.459c-.1147.3984-.5317.627-.9292.5112-.3975-.1152-.6265-.5312-.5112-.9292l1.334-4.603c.2344-.8691.8628-.938,1.0498-.938h.5469c.2876,0,.8062.1211,1.0483.9326l1.3354,4.6084c.1152.3979-.1138.814-.5112.9292Zm6.104-2.4702c0,1.3784-1.1216,2.5-2.5,2.5h-1.75c-.4141,0-.75-.3359-.75-.75v-5c0-.4141.3359-.75.75-.75h1.75c1.3784,0,2.5,1.1216,2.5,2.5v1.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default audioDescription;
