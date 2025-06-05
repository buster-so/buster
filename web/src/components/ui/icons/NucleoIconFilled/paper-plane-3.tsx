import type { iconProps } from './iconProps';

function paperPlane3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px paper plane 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.823,9.461L7.406.86h0C7.134.33,6.595.001,6,.001s-1.134.329-1.406.858L.177,9.462c-.289.563-.223,1.219.174,1.712.308.382.753.592,1.224.592.136,0,.274-.018.412-.054l3.264-.85v-3.11c0-.414.336-.75.75-.75s.75.336.75.75v3.102l3.264.859c.616.164,1.24-.045,1.636-.538.396-.493.463-1.149.174-1.713Zm-.667.343h0s0,0,0,0h0Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default paperPlane3;
