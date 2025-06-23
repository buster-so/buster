import type { iconProps } from './iconProps';

function shadow2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shadow 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.873,5.071c.237,.598,.377,1.246,.377,1.929,0,2.899-2.35,5.25-5.25,5.25-.683,0-1.331-.14-1.929-.377,.425,2.895,2.918,5.127,5.929,5.127,3.309,0,6-2.691,6-6,0-3.011-2.232-5.504-5.127-5.929Z"
          fill="currentColor"
        />
        <path
          d="M7,13c-3.309,0-6-2.691-6-6S3.691,1,7,1s6,2.691,6,6-2.691,6-6,6Zm0-10.5c-2.481,0-4.5,2.019-4.5,4.5s2.019,4.5,4.5,4.5,4.5-2.019,4.5-4.5S9.481,2.5,7,2.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shadow2;
