import type { iconProps } from './iconProps';

function squareSettings(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square settings';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="9" fill="currentColor" r="1.25" strokeWidth="0" />
        <path
          d="m13.25,2H4.75c-1.517,0-2.75,1.2329-2.75,2.75v8.5c0,1.5171,1.233,2.75,2.75,2.75h8.5c1.517,0,2.75-1.2329,2.75-2.75V4.75c0-1.5171-1.233-2.75-2.75-2.75Zm-1,7.75h-.6171c-.0586.2051-.1395.3984-.2415.5811l.4366.437c.293.293.293.7681,0,1.0605-.1465.1465-.3389.2197-.5303.2197-.1924,0-.3838-.0732-.5303-.2197l-.4367-.437c-.1824.1021-.376.1826-.5809.2412v.6172c0,.4141-.3359.75-.75.75s-.75-.3359-.75-.75v-.6172c-.2049-.0586-.3984-.1392-.5809-.2412l-.4367.437c-.1465.1465-.3379.2197-.5303.2197-.1914,0-.3838-.0732-.5303-.2197-.293-.2925-.293-.7676,0-1.0605l.4366-.437c-.102-.1826-.1829-.376-.2415-.5811h-.6171c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h.6171c.0586-.2051.1395-.3984.2415-.5811l-.4366-.437c-.293-.293-.293-.7681,0-1.0605.293-.2939.7676-.292,1.0605,0l.4367.437c.1824-.1021.376-.1826.5809-.2412v-.6172c0-.4141.3359-.75.75-.75s.75.3359.75.75v.6172c.2049.0586.3984.1392.5809.2412l.4367-.437c.293-.292.7676-.2939,1.0605,0,.293.2925.293.7676,0,1.0605l-.4366.437c.102.1826.1829.376.2415.5811h.6171c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default squareSettings;
