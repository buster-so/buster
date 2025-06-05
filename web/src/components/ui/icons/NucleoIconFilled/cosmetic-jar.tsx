import type { iconProps } from './iconProps';

function cosmeticJar(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cosmetic jar';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M1,9v5c0,1.97,3.019,3,6,3s6-1.03,6-3v-5c0-3.939-12-3.939-12,0Zm6-1.5c2.792,0,4.5,.971,4.5,1.5s-1.708,1.5-4.5,1.5-4.5-.971-4.5-1.5,1.708-1.5,4.5-1.5Z"
          fill="currentColor"
        />
        <path
          d="M11,1c-2.088,0-3.994,1.073-5.1,2.87-.217,.353-.107,.815,.246,1.032,.353,.218,.814,.106,1.031-.246,.83-1.35,2.259-2.156,3.822-2.156,2.481,0,4.5,2.019,4.5,4.5,0,1.178-.457,2.294-1.286,3.142-.29,.296-.284,.771,.012,1.061,.146,.143,.335,.214,.524,.214,.194,0,.39-.075,.536-.226,1.105-1.129,1.714-2.618,1.714-4.191,0-3.309-2.691-6-6-6Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cosmeticJar;
