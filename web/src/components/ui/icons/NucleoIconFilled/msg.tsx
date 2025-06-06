import type { iconProps } from './iconProps';

function msg(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px msg';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,.001C2.691.001,0,2.693,0,6.001c0,1.08.287,2.127.833,3.049-.178.64-.422,1.247-.744,1.846-.124.232-.118.513.018.739.136.228.379.405.647.365,1.093,0,2.077-.163,2.932-.483.752.321,1.529.483,2.314.483,3.309,0,6-2.691,6-6S9.309.001,6,.001Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default msg;
