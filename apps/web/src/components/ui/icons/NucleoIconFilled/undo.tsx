import type { iconProps } from './iconProps';

function undo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px undo';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.25,8.141c-.175,0-.351-.061-.493-.185-.615-.537-2.309-1.785-4.757-1.785s-4.142,1.248-4.757,1.785c-.312.273-.786.24-1.058-.072-.272-.312-.24-.786.072-1.058.742-.648,2.787-2.155,5.743-2.155s5.001,1.507,5.743,2.155c.312.272.344.746.072,1.058-.148.17-.356.257-.565.257Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4.714,9.21c-.064,0-.13-.008-.196-.026l-3.964-1.069c-.204-.055-.375-.193-.471-.38s-.11-.406-.037-.604l1.422-3.852c.144-.388.577-.586.963-.444.389.144.587.575.444.963l-1.138,3.082,3.171.855c.4.108.637.52.529.919-.09.334-.393.555-.724.555Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default undo;
