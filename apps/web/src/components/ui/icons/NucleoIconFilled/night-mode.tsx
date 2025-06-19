import type { iconProps } from './iconProps';

function nightMode(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px night mode';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm6.21,9.919c-.643,.206-1.299,.331-1.96,.331-1.427,0-2.743-.468-3.817-1.25h5.981c-.049,.313-.113,.622-.205,.919Zm-7.26-2.419c-.223-.314-.416-.648-.581-1h7.949c.077,.325,.13,.658,.156,1H7.95Zm6.81-2.5H6.873c-.064-.325-.098-.66-.111-1h7.35c.245,.312,.463,.646,.648,1Zm-2.312-2.5H6.883c.048-.239,.122-.475,.197-.71,.607-.188,1.252-.29,1.92-.29,1.267,0,2.447,.37,3.448,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default nightMode;
