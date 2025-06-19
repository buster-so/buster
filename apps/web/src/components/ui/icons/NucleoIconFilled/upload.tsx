import type { iconProps } from './iconProps';

function upload(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px upload';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.784,8.735l-.286-1.5c-.248-1.295-1.384-2.235-2.702-2.235h-2.046v3c0,.414-.336.75-.75.75s-.75-.336-.75-.75v-3h-2.046c-1.318,0-2.454.94-2.702,2.235l-.286,1.5c-.154.808.059,1.634.583,2.268.524.633,1.297.997,2.119.997h6.164c.822,0,1.595-.363,2.119-.997.524-.634.736-1.46.583-2.268Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4.28,3.53l.97-.97v2.439h1.5v-2.439l.97.97c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061L6.53.22c-.293-.293-.768-.293-1.061,0l-2.25,2.25c-.293.293-.293.768,0,1.061s.768.293,1.061,0Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default upload;
