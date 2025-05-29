import type { iconProps } from './iconProps';

function panorama(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px panorama';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.745,15.042c-.358,0-.714-.11-1.013-.323-.459-.327-.732-.86-.732-1.426V4.707c0-.566,.273-1.099,.732-1.426,.459-.326,1.047-.412,1.581-.228,1.834,.629,3.743,.949,5.675,.95h.011c1.938,0,3.851-.32,5.688-.951,.532-.184,1.123-.097,1.58,.229,.459,.327,.732,.86,.732,1.426V13.293c0,.566-.273,1.099-.732,1.426-.458,.326-1.048,.413-1.581,.228-1.837-.63-3.75-.95-5.688-.95h-.011c-1.932,0-3.841,.321-5.676,.951-.185,.063-.377,.095-.567,.095Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default panorama;
