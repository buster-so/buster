import type { iconProps } from './iconProps';

function chefHat(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chef hat';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4,10.425v2.575h2.5v-1c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1h2v-1c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1h2.5v-2.575c.822-.167,1.569-.606,2.12-1.261,.714-.849,1.014-1.97,.822-3.078-.258-1.492-1.427-2.699-2.91-3.005-.53-.109-1.046-.102-1.544,.002-.682-1.235-1.981-2.083-3.488-2.083s-2.806,.848-3.488,2.082c-.499-.104-1.014-.111-1.543-.001-1.482,.305-2.652,1.512-2.911,3.003-.192,1.108,.107,2.23,.821,3.08,.551,.655,1.299,1.094,2.121,1.262Z"
          fill="currentColor"
        />
        <path
          d="M4,14.5v.75c0,.965,.785,1.75,1.75,1.75h6.5c.965,0,1.75-.785,1.75-1.75v-.75H4Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chefHat;
