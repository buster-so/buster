import type { iconProps } from './iconProps';

function creditCard(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px credit card';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17,5.75c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v.75H17v-.75Z"
          fill="currentColor"
        />
        <path
          d="M1,12.25c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75v-4.25H1v4.25Zm11.75-1.75h1c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-1c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75Zm-8.5,0h3c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-3c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default creditCard;
