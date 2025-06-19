import type { iconProps } from './iconProps';

function creditCardAlert(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px credit card alert';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17,5.75c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v.75H17v-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.996,8.88l1.004,1.584v-2.465h-1.865c.332,.239,.634,.522,.861,.88Z"
          fill="currentColor"
        />
        <path
          d="M7.57,13.512l2.934-4.632c.227-.358,.529-.641,.861-.88H1v4.25c0,1.517,1.233,2.75,2.75,2.75h3.333c.04-.52,.199-1.032,.487-1.488Zm-4.07-2.262c0-.414,.336-.75,.75-.75h3c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-3c-.414,0-.75-.336-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M17.662,14.313l-2.933-4.631c-.323-.509-.875-.814-1.479-.814s-1.156,.305-1.479,.814l-2.933,4.631c-.341,.539-.362,1.221-.055,1.78s.895,.906,1.533,.906h5.866c.638,0,1.226-.347,1.533-.906s.287-1.241-.055-1.78Zm-4.412,1.687c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm.75-3c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default creditCardAlert;
