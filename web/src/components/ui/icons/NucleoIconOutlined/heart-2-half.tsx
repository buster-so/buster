import type { iconProps } from './iconProps';

function heart2Half(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heart 2 half';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,4.926s0,0,0,.001c.171-.353,.396-.677,.666-.962,1.451-1.528,3.867-1.591,5.395-.139,1.528,1.451,1.59,3.867,.139,5.395l-5.48,5.694c-.197,.205-.459,.307-.721,.307"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,4.926s0,0,0,.001c-.171-.353-.396-.677-.666-.962-1.451-1.528-3.867-1.591-5.395-.139-1.528,1.451-1.59,3.867-.139,5.395l5.48,5.694c.197,.205,.459,.307,.721,.307V4.926Z"
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

export default heart2Half;
