import type { iconProps } from './iconProps';

function borderBottomRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px border bottom right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="1.25" cy="4.417" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="1.25" cy="7.583" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="7.583" cy="1.25" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="4.417" cy="1.25" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="1.25" cy="1.25" fill="currentColor" r=".75" strokeWidth="0" />
        <path
          d="m10.75,11.5H1.25c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h8.75V1.25c0-.414.336-.75.75-.75s.75.336.75.75v9.5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default borderBottomRight;
