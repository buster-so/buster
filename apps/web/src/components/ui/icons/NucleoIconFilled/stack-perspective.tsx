import type { iconProps } from './iconProps';

function stackPerspective(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px stack perspective';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9.54,2.295L6.541.367c-.308-.199-.699-.213-1.02-.037-.321.175-.521.512-.521.878v9.584c0,.366.2.703.521.878.149.082.314.122.479.122.188,0,.376-.053.54-.159l2.998-1.927c.289-.184.462-.499.462-.843V3.137c0-.344-.173-.659-.46-.841Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m1.928,10.352c-.152,0-.306-.038-.445-.114-.298-.163-.482-.475-.482-.814V2.577c0-.339.185-.651.482-.814.299-.163.662-.151.947.032l1.226.789c.349.224.449.688.226,1.037-.225.348-.689.45-1.036.225l-.345-.222v4.753l.345-.222c.347-.225.812-.123,1.036.225.224.349.123.812-.226,1.037l-1.225.788c-.153.098-.328.147-.503.147Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default stackPerspective;
