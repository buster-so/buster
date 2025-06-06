import type { iconProps } from './iconProps';

function eye(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px eye';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,1C2.688,1,0,4.025,0,6s2.688,5,6,5,6-3.025,6-5S9.312,1,6,1Zm0,7c-1.103,0-2-.897-2-2s.897-2,2-2,2,.897,2,2-.897,2-2,2Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default eye;
