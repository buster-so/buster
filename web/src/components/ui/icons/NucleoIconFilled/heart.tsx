import type { iconProps } from './iconProps';

function heart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px heart';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.593.827c-1.008.012-1.953.464-2.593,1.227-.641-.762-1.586-1.214-2.598-1.227C1.519.839-.007,2.378,0,4.257,0,8.362,4.201,10.875,5.488,11.547h0c.16.084.336.125.511.125s.352-.042.511-.125c1.287-.672,5.489-3.184,5.489-7.289.007-1.88-1.519-3.42-3.407-3.431Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default heart;
