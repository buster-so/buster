import type { iconProps } from './iconProps';

function arrowSymbolRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow symbol right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15,9.75H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M11,14c-.086,0-.174-.015-.26-.046-.389-.144-.587-.575-.444-.963,.782-2.12,2.12-3.328,3.181-3.99-1.061-.662-2.398-1.87-3.181-3.99-.144-.389,.055-.82,.444-.963,.389-.146,.82,.056,.963,.444,1.129,3.061,3.629,3.756,3.734,3.784,.331,.088,.562,.388,.56,.729-.002,.342-.232,.64-.564,.724-.102,.027-2.601,.722-3.73,3.783-.112,.303-.398,.49-.704,.49Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowSymbolRight;
