import type { iconProps } from './iconProps';

function messageSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px message sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.5,13.25c0-.859,.478-1.631,1.246-2.014l1.327-.664,.664-1.329c.373-.747,1.145-1.21,2.013-1.21s1.64,.464,2.013,1.21l.664,1.329,.573,.287V4.25c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v7c0,1.517,1.233,2.75,2.75,2.75h1.25v2.25c0,.288,.165,.551,.425,.676,.104,.05,.215,.074,.325,.074,.167,0,.333-.056,.469-.165l2.769-2.215c-.301-.386-.488-.857-.488-1.37Z"
          fill="currentColor"
        />
        <path
          d="M17.085,12.579l-1.776-.888-.888-1.776c-.254-.508-1.088-.508-1.342,0l-.888,1.776-1.776,.888c-.255,.127-.415,.387-.415,.671s.16,.544,.415,.671l1.776,.888,.888,1.776c.127,.254,.387,.415,.671,.415s.544-.161,.671-.415l.888-1.776,1.776-.888c.255-.127,.415-.387,.415-.671s-.16-.544-.415-.671Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default messageSparkle;
