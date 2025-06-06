import type { iconProps } from './iconProps';

function envelopeAlert(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px envelope alert';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,2.5H3.75c-1.517,0-2.75,1.233-2.75,2.75v7.5c0,1.517,1.233,2.75,2.75,2.75h3c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.689,0-1.25-.561-1.25-1.25V7.021l5.654,3.12c.265,.146,.556,.219,.846,.219s.581-.073,.846-.219l5.654-3.12v2.877c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V5.25c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M17.412,14.813l-2.933-4.631c-.323-.509-.875-.814-1.479-.814s-1.156,.305-1.479,.814l-2.933,4.631c-.341,.539-.362,1.221-.055,1.78s.895,.906,1.533,.906h5.866c.638,0,1.226-.347,1.533-.906s.287-1.241-.055-1.78Zm-4.412,1.687c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm.75-3c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default envelopeAlert;
