import type { iconProps } from './iconProps';

function moonFull(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px moon full';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm-2.5,9c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm3.25,2.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm1-4.5c-.69,0-1.25-.56-1.25-1.25s.56-1.25,1.25-1.25,1.25,.56,1.25,1.25-.56,1.25-1.25,1.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default moonFull;
