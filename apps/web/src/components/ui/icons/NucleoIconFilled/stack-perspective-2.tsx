import type { iconProps } from './iconProps';

function stackPerspective2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px stack perspective 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6.764,3.705l-4.5-1.377c-.54-.165-1.106-.067-1.556.267-.45.333-.708.843-.708,1.401v4.882c0,.771.497,1.442,1.236,1.668l4.5,1.377c.172.052.346.078.519.078.369,0,.73-.118,1.037-.345.45-.333.708-.843.708-1.401v-4.882c0-.771-.497-1.442-1.236-1.668Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.256,9.751c-.173,0-.348-.026-.52-.079l-.206-.062c-.396-.121-.618-.541-.497-.937.121-.396.539-.621.937-.498l.206.063c.107.033.187-.01.225-.038.037-.027.1-.089.1-.195V3.123c0-.108-.07-.202-.176-.234l-4.5-1.377c-.129-.042-.249.031-.298.124-.19.367-.642.512-1.011.322-.367-.19-.512-.643-.321-1.011C4.582.195,5.452-.171,6.264.078l4.5,1.377c.739.226,1.236.897,1.236,1.668v4.881c0,.559-.258,1.069-.708,1.402-.308.227-.668.345-1.036.345Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default stackPerspective2;
