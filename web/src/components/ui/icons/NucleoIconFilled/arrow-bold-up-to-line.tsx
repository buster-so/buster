import type { iconProps } from './iconProps';

function arrowBoldUpToLine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow bold up to line';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.013,4.461c-.469-.647-1.557-.648-2.025,0L3.967,10.017c-.277,.383-.315,.881-.101,1.302,.215,.42,.641,.681,1.113,.681h1.521v3.25c0,.965,.785,1.75,1.75,1.75h1.5c.965,0,1.75-.785,1.75-1.75v-3.25h1.521c.472,0,.898-.261,1.113-.681,.214-.42,.176-.919-.101-1.302l-4.021-5.556Z"
          fill="currentColor"
        />
        <path
          d="M14.25,1H3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H14.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowBoldUpToLine;
