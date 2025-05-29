import type { iconProps } from './iconProps';

function sack(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sack';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.849,4h2.401v-.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v.75h2.401l1.223-1.834c.082-.123,.126-.268,.126-.416,0-.965-.785-1.75-1.75-1.75H6.25c-.965,0-1.75,.785-1.75,1.75,0,.148,.044,.293,.126,.416l1.223,1.834Z"
          fill="currentColor"
        />
        <path
          d="M5.101,5.5c-1.683,1.705-2.851,4.213-2.851,6.5s1.171,5,6.75,5,6.75-2.719,6.75-5-1.168-4.795-2.851-6.5H5.101Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sack;
