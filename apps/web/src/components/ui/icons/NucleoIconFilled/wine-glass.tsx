import type { iconProps } from './iconProps';

function wineGlass(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px wine glass';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.25,15.5h-2.5v-3.562c1.196-.177,2.303-.766,3.111-1.688,.975-1.111,1.423-2.59,1.23-4.055l-.598-4.543c-.049-.374-.367-.652-.744-.652H5.25c-.376,0-.694,.279-.744,.652l-.598,4.543c-.193,1.465,.255,2.944,1.23,4.055,.808,.921,1.914,1.51,3.111,1.688v3.562h-2.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Zm-.158-13l.46,3.5H5.447l.46-3.5h6.185Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default wineGlass;
