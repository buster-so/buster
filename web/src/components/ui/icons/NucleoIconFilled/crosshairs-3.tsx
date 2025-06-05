import type { iconProps } from './iconProps';

function crosshairs3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px crosshairs 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm-2,8.75h-2.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm2.75,3.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.25Zm0-6.25c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.25Zm3.5,2.75h-2.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default crosshairs3;
