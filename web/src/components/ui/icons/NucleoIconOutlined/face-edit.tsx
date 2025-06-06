import type { iconProps } from './iconProps';

function faceEdit(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face edit';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.25,10.758c-.472,.746-1.304,1.242-2.25,1.242s-1.778-.496-2.25-1.242"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.236,8.272c.003-.091,.014-.18,.014-.272,0-4.004-3.246-7.25-7.25-7.25S1.75,3.996,1.75,8c0,3.936,3.139,7.133,7.049,7.24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.207,16.401c.143-.049,.273-.131,.38-.238l3.303-3.303c.483-.483,.478-1.261-.005-1.745h0c-.483-.483-1.261-.489-1.745-.005l-3.303,3.303c-.107,.107-.189,.237-.238,.38l-.849,2.457,2.457-.849Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="8" fill="currentColor" r="1" />
        <circle cx="12" cy="8" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default faceEdit;
