import type { iconProps } from './iconProps';

function borderX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px border x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m1.25,11.5c-.414,0-.75-.336-.75-.75V1.25c0-.414.336-.75.75-.75s.75.336.75.75v9.5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.75,11.5c-.414,0-.75-.336-.75-.75V1.25c0-.414.336-.75.75-.75s.75.336.75.75v9.5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <circle cx="6" cy="6" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="3.25" cy="6" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="8.75" cy="6" fill="currentColor" r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default borderX;
