import type { iconProps } from './iconProps';

function userGallery(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user gallery';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.5,15.5c0-.771,.301-1.468,.78-2-.48-.532-.78-1.229-.78-2,0-1.009,.504-1.899,1.271-2.443-.255-.029-.511-.057-.772-.057-2.763,0-5.273,1.636-6.394,4.167-.257,.58-.254,1.245,.008,1.825,.268,.591,.777,1.043,1.399,1.239,1.591,.501,3.241,.757,4.904,.766-.257-.442-.416-.949-.416-1.497Z"
          fill="currentColor"
        />
        <circle cx="11.5" cy="11.5" fill="currentColor" r="1.5" />
        <circle cx="15.5" cy="11.5" fill="currentColor" r="1.5" />
        <circle cx="11.5" cy="15.5" fill="currentColor" r="1.5" />
        <circle cx="15.5" cy="15.5" fill="currentColor" r="1.5" />
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
      </g>
    </svg>
  );
}

export default userGallery;
