import type { iconProps } from './iconProps';

function vrController(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px vr controller';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9,14.5c-.834,0-1.677-.04-2.5-.124v.124c0,1.378,1.122,2.5,2.5,2.5s2.5-1.122,2.5-2.5v-.124c-.823.084-1.666.124-2.5.124Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6.5,12.364c.817.09,1.665.136,2.5.136s1.683-.046,2.5-.136v-4.249c.946-.757,1.5-1.894,1.5-3.115,0-2.206-1.794-4-4-4s-4,1.794-4,4c0,1.222.554,2.358,1.5,3.115v4.249Zm2.5-8.864c.828,0,1.5.672,1.5,1.5s-.672,1.5-1.5,1.5-1.5-.672-1.5-1.5.672-1.5,1.5-1.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9,13c-3.8535,0-8-.939-8-3,0-.6636.4424-1.5972,2.5527-2.2759.3916-.126.8164.0894.9434.4839s-.0898.8169-.4844.9438c-1.1836.3813-1.4941.7705-1.5117.854.0898.4033,2.2246,1.4941,6.5,1.4941s6.4102-1.0908,6.5-1.5054c-.0176-.0723-.3281-.4614-1.5117-.8428-.3945-.127-.6113-.5493-.4844-.9438s.5508-.6094.9434-.4839c2.1104.6787,2.5527,1.6123,2.5527,2.2759,0,2.061-4.1465,3-8,3Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default vrController;
