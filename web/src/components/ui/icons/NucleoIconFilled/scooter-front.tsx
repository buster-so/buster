import type { iconProps } from './iconProps';

function scooterFront(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px scooter front';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.25,5H6.75c-1.517,0-2.75,1.233-2.75,2.75v4.5c0,1.517,1.233,2.75,2.75,2.75h.5v-3c0-.967,.784-1.75,1.75-1.75s1.75,.783,1.75,1.75v3h.5c1.517,0,2.75-1.233,2.75-2.75V7.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M9,17.5c-1.379,0-2.5-1.122-2.5-2.5v-3c0-1.378,1.121-2.5,2.5-2.5s2.5,1.122,2.5,2.5v3c0,1.378-1.121,2.5-2.5,2.5Zm0-6.5c-.552,0-1,.449-1,1v3c0,.551,.448,1,1,1s1-.449,1-1v-3c0-.551-.448-1-1-1Z"
          fill="currentColor"
        />
        <path
          d="M13.75,2.5h-2.117c-.329-1.151-1.378-2-2.633-2s-2.304,.849-2.633,2h-2.117c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.117c.329,1.151,1.378,2,2.633,2s2.304-.849,2.633-2h2.117c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Zm-4.75,2c-.689,0-1.25-.561-1.25-1.25s.561-1.25,1.25-1.25,1.25,.561,1.25,1.25-.561,1.25-1.25,1.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default scooterFront;
