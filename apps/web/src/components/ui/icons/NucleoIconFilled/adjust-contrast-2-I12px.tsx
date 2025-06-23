import type { iconProps } from './iconProps';

function adjustContrast2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px adjust contrast 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm0,1.5c1.522,0,2.921,.53,4.03,1.41L3.909,13.03c-.88-1.109-1.409-2.508-1.409-4.03,0-3.584,2.916-6.5,6.5-6.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default adjustContrast2;
