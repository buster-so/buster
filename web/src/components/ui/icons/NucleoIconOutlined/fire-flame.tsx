import type { iconProps } from './iconProps';

function fireFlame(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px fire flame';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.962,16.25c-.28-2.75,1.803-2.097,1.875-4.501,1.581,.851,2.239,2.987,2.2,4.465"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.037,16.214c3.901-1.516,4.725-5.833,1.964-9.85"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.533,7.37s.696-3.766-2.044-5.62c-.364,4.375-5.109,4.531-5.109,9.237,0,2.117,1.096,4.402,3.582,5.263"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default fireFlame;
