import type { iconProps } from './iconProps';

function externalLink(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px external link';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.25,1H6.25c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,.059,.014,.114,.017,.172l5.922-5.922h-2.2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h4.01c.414,0,.75,.336,.75,.75v4.01c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.2l-6.392,6.393c.504,.633,1.272,1.047,2.142,1.047h6c1.517,0,2.75-1.233,2.75-2.75V3.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M3.517,13.422l-2.298,2.298c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l1.827-1.827c-.34-.427-.554-.953-.59-1.531Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default externalLink;
