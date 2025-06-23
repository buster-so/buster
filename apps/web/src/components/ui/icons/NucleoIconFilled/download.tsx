import type { iconProps } from './iconProps';

function download(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px download';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.426,4.477c-.14-1.412-1.316-2.477-2.735-2.477h-1.94v4.189l.97-.97c.293-.293.768-.293,1.061,0s.293.768,0,1.061l-2.25,2.25c-.146.146-.338.22-.53.22s-.384-.073-.53-.22l-2.25-2.25c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l.97.97V2h-1.94c-1.419,0-2.596,1.065-2.735,2.476l-.351,3.5c-.077.772.178,1.544.698,2.12.52.574,1.263.904,2.038.904h6.08c.775,0,1.519-.33,2.038-.904.521-.575.775-1.348.698-2.12l-.351-3.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6.75,2V.75c0-.414-.336-.75-.75-.75s-.75.336-.75.75v1.25h1.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default download;
