import type { iconProps } from './iconProps';

function monitorVideo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px monitor video';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M17.619,1.288c-.234-.133-.525-.129-.754,.011l-2.122,1.272c-.15,.09-.243,.253-.243,.429v1c0,.176,.092,.339,.243,.429l2.121,1.271c.119,.072,.253,.108,.387,.108,.127,0,.254-.032,.368-.097,.235-.133,.381-.383,.381-.653V1.941c0-.271-.146-.521-.381-.653Z"
          fill="currentColor"
        />
        <path
          d="M5.75,16.25c.758-.239,1.878-.5,3.25-.5,.795,0,1.941,.088,3.25,.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 13.25L9 15.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,7.349v3.901c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2V4.75c0-1.105,.895-2,2-2h2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="5.5"
          width="6"
          fill="none"
          rx="1.75"
          ry="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="8.75"
          y=".75"
        />
      </g>
    </svg>
  );
}

export default monitorVideo;
