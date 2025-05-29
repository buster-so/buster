import type { iconProps } from './iconProps';

function nail(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px nail';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.75 14.75L7.25 14.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.253,3.317c1.487,.803,2.497,2.375,2.497,4.183v8.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25,16.25V7.5c0-1.804,1.005-3.372,2.486-4.177"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75,2.302c0-.361,.189-.704,.509-.871,.404-.211,1-.43,1.741-.43,.258,0,.96,.027,1.723,.42,.327,.169,.527,.517,.527,.885V7.75c0,1.105-.895,2-2,2h-.5c-1.105,0-2-.895-2-2V2.302Z"
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

export default nail;
