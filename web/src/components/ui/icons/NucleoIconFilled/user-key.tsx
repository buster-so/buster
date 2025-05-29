import type { iconProps } from './iconProps';

function userKey(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user key';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M8.5,13.75c0-2.068,1.682-3.75,3.75-3.75,.14,0,.273,.033,.41,.049-1.081-.667-2.339-1.049-3.66-1.049-2.764,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.591,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769,.44,0,.878-.019,1.315-.054-1.083-.658-1.815-1.838-1.815-3.196Z"
          fill="currentColor"
        />
        <path
          d="M17.25,13h-2.888c-.311-.871-1.135-1.5-2.112-1.5-1.241,0-2.25,1.009-2.25,2.25s1.009,2.25,2.25,2.25c.976,0,1.801-.629,2.112-1.5h1.138v.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.5h.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Zm-5,1.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userKey;
