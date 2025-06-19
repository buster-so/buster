import type { iconProps } from './iconProps';

function hand3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hand 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m15.9874,7c-1.3749.0068-2.4874,1.1233-2.4874,2.5v1.5c0,.2761-.2238.5-.5.5s-.5-.2239-.5-.5v-1.5c0-.6497.1896-1.2505.5-1.7717V2.75c0-.552-.448-1-1-1s-1,.448-1,1v4.75c0,.2759-.224.5-.5.5s-.5-.2241-.5-.5V1.5c0-.552-.448-1-1-1s-1,.448-1,1v6c0,.2759-.224.5-.5.5s-.5-.2241-.5-.5V2.75c0-.552-.448-1-1-1s-1,.448-1,1v4.75c0,.2759-.224.5-.5.5s-.5-.2241-.5-.5v-3.25c0-.5518-.4478-.9995-.9995-1-.5517.0005-.9995.4482-.9995,1l-.0005,6.7495c-.0003,3.5901,2.9099,6.5005,6.5,6.5005h1.4995c3.5898,0,6.5-2.9102,6.5-6.5v-3.5c0-.2795-.233-.5015-.5126-.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default hand3;
