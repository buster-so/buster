import type { iconProps } from './iconProps';

function machineWash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px machine wash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75,8.209c1.207,.003,2.353-.531,3.125-1.459,1.447,1.726,4.018,1.953,5.744,.506,.183-.153,.353-.322,.506-.506,.771,.929,1.917,1.465,3.125,1.459"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,3.75l-1.04,8.736c-.12,1.006-.973,1.764-1.986,1.764H4.776c-1.013,0-1.866-.758-1.986-1.764L1.75,3.75"
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

export default machineWash;
