import type { iconProps } from './iconProps';

function seedling(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px seedling';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,9c-.414,0-.75-.336-.75-.75v-1c0-2.343,1.907-4.25,4.25-4.25h1.75c.414,0,.75.336.75.75v.5c0,2.058-1.312,3.871-3.266,4.513-.394.133-.817-.085-.947-.478-.129-.394.085-.817.478-.947,1.257-.413,2.126-1.535,2.225-2.838h-.991c-1.517,0-2.75,1.233-2.75,2.75v1c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m2.5,1H.75c-.414,0-.75.336-.75.75v.5c0,2.619,2.131,4.75,4.75,4.75h.5v4.25c0,.414.336.75.75.75s.75-.336.75-.75v-6c0-2.343-1.907-4.25-4.25-4.25Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default seedling;
