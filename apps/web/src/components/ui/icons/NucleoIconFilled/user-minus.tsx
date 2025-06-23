import type { iconProps } from './iconProps';

function userMinus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M10,14.75c0-1.241,1.01-2.25,2.25-2.25h2.789c-1.241-2.143-3.529-3.5-6.039-3.5-2.765,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.592,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769,.797,0,1.591-.062,2.377-.177-.808-.342-1.377-1.142-1.377-2.073Z"
          fill="currentColor"
        />
        <path
          d="M17.25,15.5h-5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userMinus;
