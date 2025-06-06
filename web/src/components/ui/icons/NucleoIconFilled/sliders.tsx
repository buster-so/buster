import type { iconProps } from './iconProps';

function sliders(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px sliders';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.25,9.5H.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h10.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.25,4H.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h10.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <circle cx="4.5" cy="8.75" fill="currentColor" r="2.5" strokeWidth="0" />
        <circle cx="7.5" cy="3.25" fill="currentColor" r="2.5" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default sliders;
