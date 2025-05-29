import type { iconProps } from './iconProps';

function arrowBoldLeftFromLine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow bold left from line';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.25,6h-3.25v-1.463c0-.484-.271-.915-.707-1.125-.438-.211-.942-.154-1.321,.147h0S1.365,8.022,1.365,8.022c-.299,.239-.471,.595-.471,.978s.172,.739,.472,.978l5.605,4.463c.228,.18,.5,.273,.776,.273,.185,0,.371-.042,.545-.126,.437-.21,.707-.642,.707-1.125v-1.463h3.25c.965,0,1.75-.785,1.75-1.75v-2.5c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,6c-.414,0-.75,.336-.75,.75v4.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V6.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowBoldLeftFromLine;
