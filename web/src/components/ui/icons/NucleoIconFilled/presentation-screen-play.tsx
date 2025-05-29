import type { iconProps } from './iconProps';

function presentationScreenPlay(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px presentation screen play';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.75,17c-.079,0-.159-.012-.237-.039-.393-.131-.605-.556-.474-.949l1-3c.13-.393,.556-.607,.949-.474,.393,.131,.605,.556,.474,.949l-1,3c-.104,.314-.397,.513-.711,.513Z"
          fill="currentColor"
        />
        <path
          d="M12.25,17c-.314,0-.607-.199-.711-.513l-1-3c-.131-.393,.081-.818,.474-.949,.394-.131,.818,.082,.949,.474l1,3c.131,.393-.081,.818-.474,.949-.079,.026-.159,.039-.237,.039Z"
          fill="currentColor"
        />
        <path
          d="M14.25,2h-4.5v-.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v.5H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-3.087,6.574l-3.14,1.832c-.107,.062-.225,.094-.343,.094-.117,0-.233-.031-.339-.092-.213-.123-.341-.343-.341-.589v-3.663c0-.246,.127-.467,.341-.589,.213-.123,.468-.123,.682,0l3.14,1.832c.211,.123,.337,.343,.337,.587s-.126,.464-.337,.587Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default presentationScreenPlay;
