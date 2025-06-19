import type { iconProps } from './iconProps';

function thumbsUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px thumbs up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.461,5.117c-.524-.71-1.331-1.117-2.212-1.117h-1.62l.386-1.218c.336-1.069-.175-2.235-1.19-2.711-.304-.142-.694-.055-.906.206l-2.802,3.449c-.397.488-.616,1.104-.616,1.734v3.79c0,1.517,1.233,2.75,2.75,2.75h3.229c1.215,0,2.271-.78,2.628-1.941l.769-2.5c.259-.843.108-1.733-.416-2.442Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m.75,11.5c-.414,0-.75-.336-.75-.75v-5.5c0-.414.336-.75.75-.75s.75.336.75.75v5.5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default thumbsUp;
