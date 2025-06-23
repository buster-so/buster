import type { iconProps } from './iconProps';

function typeScale(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px type scale';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,2H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H6V15.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.5h4.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,7h-6c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.25v6.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-6.75h2.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default typeScale;
