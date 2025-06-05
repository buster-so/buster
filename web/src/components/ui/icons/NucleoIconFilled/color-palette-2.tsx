import type { iconProps } from './iconProps';

function colorPalette2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px color palette 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.25,2H3.75c-.965,0-1.75,.785-1.75,1.75V13c0,1.654,1.346,3,3,3s3-1.346,3-3V3.75c0-.965-.785-1.75-1.75-1.75Zm-1.25,11.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.662,6.106l-1.768-1.768c-.635-.636-1.723-.654-2.395-.065V12.742l4.162-4.162c.331-.331,.513-.77,.513-1.237s-.182-.907-.513-1.237Z"
          fill="currentColor"
        />
        <path
          d="M14.353,10.01l-5.99,5.99h5.887c.965,0,1.75-.785,1.75-1.75v-2.5c0-.929-.731-1.685-1.647-1.74Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default colorPalette2;
