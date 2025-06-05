import type { iconProps } from './iconProps';

function sitemap2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sitemap 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.75,8h-3v-2.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.75h-3c-1.517,0-2.75,1.233-2.75,2.75v1.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.5c0-.689,.561-1.25,1.25-1.25h3v2.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.75h3c.689,0,1.25,.561,1.25,1.25v1.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.5c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <rect height="5" width="5" fill="currentColor" rx="1.75" ry="1.75" x="6.5" y="1" />
        <rect height="5" width="5" fill="currentColor" rx="1.75" ry="1.75" x=".75" y="11.5" />
        <rect height="5" width="5" fill="currentColor" rx="1.75" ry="1.75" x="6.5" y="11.5" />
        <rect height="5" width="5" fill="currentColor" rx="1.75" ry="1.75" x="12.25" y="11.5" />
      </g>
    </svg>
  );
}

export default sitemap2;
