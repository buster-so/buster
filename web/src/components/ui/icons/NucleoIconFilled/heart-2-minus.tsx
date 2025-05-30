import type { iconProps } from './iconProps';

function heart2Minus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heart 2 minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.5,11.75c0-1.241,1.01-2.25,2.25-2.25h4.192c.944-1.141,1.286-2.66,.899-4.135-.217-.826-.693-1.595-1.342-2.164-1.11-.974-2.559-1.368-3.969-1.084-1.003,.203-1.883,.718-2.534,1.464-.039-.044-.079-.088-.12-.132-.84-.884-1.974-1.389-3.193-1.42-1.211-.026-2.378,.414-3.262,1.253-1.825,1.734-1.9,4.63-.163,6.459l5.479,5.694c.332,.346,.78,.537,1.26,.537h0c.48,0,.928-.19,1.261-.537l1.392-1.447c-1.193-.053-2.151-1.033-2.151-2.24Z"
          fill="currentColor"
        />
        <path
          d="M16.75,11h-5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default heart2Minus;
