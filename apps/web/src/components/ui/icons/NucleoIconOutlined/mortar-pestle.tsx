import type { iconProps } from './iconProps';

function mortarPestle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px mortar pestle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.281,7.75l2.703-3.76c.456-.634,.312-1.518-.322-1.974s-1.518-.312-1.974,.322l-3.901,5.412"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75,7.75v.25c0,2.432,1.392,4.535,3.421,5.568l-.265,1.061c-.079,.316,.16,.621,.485,.621h5.219c.325,0,.564-.306,.485-.621l-.265-1.061c2.028-1.033,3.421-3.136,3.421-5.568v-.25H2.75Z"
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

export default mortarPestle;
