import type { iconProps } from './iconProps';

function arrowSymbolUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow symbol up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,16c-.414,0-.75-.336-.75-.75V3c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V15.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.25,7.75c-.086,0-.174-.015-.26-.046-2.12-.782-3.328-2.12-3.99-3.181-.662,1.061-1.87,2.398-3.99,3.181-.391,.142-.82-.056-.963-.444-.144-.389,.055-.82,.444-.963,3.061-1.129,3.756-3.629,3.784-3.734,.087-.329,.386-.56,.726-.56h.004c.342,.002,.64,.232,.724,.564,.027,.102,.722,2.601,3.783,3.73,.389,.144,.587,.575,.444,.963-.112,.303-.398,.49-.704,.49Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowSymbolUp;
