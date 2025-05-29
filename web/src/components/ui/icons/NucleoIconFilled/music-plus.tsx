import type { iconProps } from './iconProps';

function musicPlus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px music plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m14.881,1.8459c-.394-.333-.908-.4749-1.419-.3909v-.001l-5.4539.9092c.3032.3833.4919.8611.4919,1.3867,0,1.2407-1.0098,2.25-2.25,2.25h-.25v.25c0,.7783-.3977,1.4648-1,1.8691v3.1948c-.377-.1938-.798-.314-1.25-.314-1.517,0-2.75,1.2329-2.75,2.75s1.233,2.75,2.75,2.75,2.75-1.2329,2.75-2.75v-6.365l7.5-1.25v3.679c-.377-.1938-.798-.314-1.25-.314-1.517,0-2.75,1.2329-2.75,2.75s1.233,2.75,2.75,2.75,2.75-1.2329,2.75-2.75V3.1809c0-.5159-.226-1.002-.619-1.335Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6.25,3h-1.75v-1.75c0-.4141-.3359-.75-.75-.75s-.75.3359-.75.75v1.75h-1.75c-.4141,0-.75.3359-.75.75s.3359.75.75.75h1.75v1.75c0,.4141.3359.75.75.75s.75-.3359.75-.75v-1.75h1.75c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default musicPlus;
