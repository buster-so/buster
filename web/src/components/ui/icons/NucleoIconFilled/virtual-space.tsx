import type { iconProps } from './iconProps';

function virtualSpace(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px virtual space';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,2C5.147,2,1,2.939,1,5V13c0,1.766,2.902,2.483,4.632,2.753,.039,.006,.077,.009,.116,.009,.178,0,.351-.063,.488-.18,.167-.143,.262-.351,.262-.57v-3.353c1.609-.192,3.395-.192,5.003,0v3.353c0,.219,.096,.427,.263,.57,.137,.117,.31,.18,.488,.18,.039,0,.077-.003,.116-.009,1.73-.27,4.632-.987,4.632-2.753V5c0-2.061-4.147-3-8-3Zm-2.501,8.15v-3.138c0-.37-.268-.684-.633-.741-2.418-.376-3.303-1.055-3.363-1.27,.102-.417,2.236-1.501,6.497-1.501s6.39,1.081,6.497,1.5c-.057,.213-.941,.894-3.363,1.271-.365,.057-.634,.372-.634,.741v3.138c-1.62-.178-3.38-.178-5.001,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default virtualSpace;
