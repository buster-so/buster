import type { iconProps } from './iconProps';

function sitemap4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sitemap 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.25,8h-1.5v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.5c-1.517,0-2.75,1.233-2.75,2.75v1c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1c0-.689,.561-1.25,1.25-1.25h4.5c.689,0,1.25,.561,1.25,1.25v1c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <rect height="6" width="6" fill="currentColor" rx="1.75" ry="1.75" x="6" y="1" />
        <rect height="6" width="6" fill="currentColor" rx="1.75" ry="1.75" x="1.75" y="11" />
        <rect height="6" width="6" fill="currentColor" rx="1.75" ry="1.75" x="10.25" y="11" />
      </g>
    </svg>
  );
}

export default sitemap4;
