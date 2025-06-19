import type { iconProps } from './iconProps';

function userAlert(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user alert';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M7.22,16.819c-.571-1.042-.532-2.307,.101-3.307l2.797-4.416c-.366-.059-.738-.096-1.117-.096-2.765,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.592,.777,1.043,1.399,1.239,1.064,.335,2.155,.551,3.258,.667-.016-.027-.036-.052-.051-.079Z"
          fill="currentColor"
        />
        <path
          d="M17.412,14.313l-2.933-4.631c-.323-.509-.875-.814-1.479-.814s-1.156,.305-1.479,.814l-2.933,4.631c-.341,.539-.362,1.221-.055,1.78s.895,.906,1.533,.906h5.866c.638,0,1.226-.347,1.533-.906s.287-1.241-.055-1.78Zm-4.412,1.687c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm.75-3c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userAlert;
