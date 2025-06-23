import type { iconProps } from './iconProps';

function archiveSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px archive sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m15.25,8.4609c-.4141,0-.75.3359-.75.75v.2891h-2.75c-.4141,0-.75.3359-.75.75v1.5c0,.1377-.1123.25-.25.25h-3.5c-.1377,0-.25-.1123-.25-.25v-1.5c0-.4141-.3359-.75-.75-.75h-2.75v-4.75c0-.6895.5605-1.25,1.25-1.25h4.0391c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75h-4.0391c-1.5166,0-2.75,1.2334-2.75,2.75v8.5c0,1.5166,1.2334,2.75,2.75,2.75h8.5c1.5166,0,2.75-1.2334,2.75-2.75v-4.0391c0-.4141-.3359-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m16.4873,4.0549l-1.8945-.6309-.6313-1.8945c-.1021-.3057-.3887-.5127-.7114-.5127s-.6094.207-.7114.5127l-.6313,1.8945-1.8945.6309c-.3062.1025-.5127.3887-.5127.7119s.2065.6094.5127.7119l1.8945.6309.6313,1.8945c.1021.3057.3887.5127.7114.5127s.6094-.207.7114-.5127l.6313-1.8945,1.8945-.6309c.3062-.1025.5127-.3887.5127-.7119s-.2065-.6094-.5127-.7119Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default archiveSparkle;
