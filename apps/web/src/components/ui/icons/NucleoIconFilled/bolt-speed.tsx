import type { iconProps } from './iconProps';

function boltSpeed(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bolt speed';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m17.223,7.531c-.174-.328-.513-.531-.883-.531h-3.91l.718-4.846c.069-.46-.187-.899-.62-1.068-.434-.167-.918-.016-1.179.369l-5.397,7.988c-.207.307-.228.702-.053,1.029.174.327.512.53.883.53h3.91l-.719,4.848c-.067.46.188.899.622,1.067.118.046.24.068.36.068.32,0,.628-.157.817-.437l5.396-7.986c.208-.307.229-.702.055-1.029Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4,9.75H.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h3.25c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m5.25,6.5h-2c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h2c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m5.25,13h-2c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h2c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default boltSpeed;
