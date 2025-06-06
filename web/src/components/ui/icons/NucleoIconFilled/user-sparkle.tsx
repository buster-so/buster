import type { iconProps } from './iconProps';

function userSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M11.073,16.427l-1.329-.665c-.767-.382-1.244-1.154-1.244-2.013s.478-1.631,1.246-2.014l1.327-.664,.664-1.329c.025-.05,.065-.088,.094-.135-.876-.39-1.836-.609-2.831-.609-2.765,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.592,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769,.763,0,1.523-.06,2.277-.165l-.204-.408Z"
          fill="currentColor"
        />
        <path
          d="M17.085,13.079l-1.776-.888-.888-1.776c-.254-.508-1.088-.508-1.342,0l-.888,1.776-1.776,.888c-.255,.127-.415,.387-.415,.671s.16,.544,.415,.671l1.776,.888,.888,1.776c.127,.254,.387,.415,.671,.415s.544-.161,.671-.415l.888-1.776,1.776-.888c.255-.127,.415-.387,.415-.671s-.16-.544-.415-.671Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userSparkle;
