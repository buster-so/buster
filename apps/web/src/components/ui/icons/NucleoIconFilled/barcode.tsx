import type { iconProps } from './iconProps';

function barcode(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px barcode';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m1.25,11c-.414,0-.75-.336-.75-.75V1.75c0-.414.336-.75.75-.75s.75.336.75.75v8.5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m3.75,7c-.414,0-.75-.336-.75-.75V1.75c0-.414.336-.75.75-.75s.75.336.75.75v4.5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6.25,11c-.414,0-.75-.336-.75-.75V1.75c0-.414.336-.75.75-.75s.75.336.75.75v8.5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m8.75,7c-.414,0-.75-.336-.75-.75V1.75c0-.414.336-.75.75-.75s.75.336.75.75v4.5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.25,11c-.414,0-.75-.336-.75-.75V1.75c0-.414.336-.75.75-.75s.75.336.75.75v8.5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default barcode;
