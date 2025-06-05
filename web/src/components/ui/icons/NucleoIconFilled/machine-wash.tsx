import type { iconProps } from './iconProps';

function machineWash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px machine wash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.339,3.005c-.41-.054-.784,.245-.833,.656l-.45,3.777c-.924-.051-1.764-.457-2.354-1.167-.142-.172-.353-.271-.576-.271h-.001c-.222,0-.433,.099-.576,.269-.125,.15-.264,.288-.412,.412-.681,.571-1.544,.844-2.429,.765-.885-.078-1.687-.496-2.258-1.178-.143-.17-.353-.268-.575-.268h-.001c-.222,0-.433,.099-.575,.27-.589,.707-1.469,1.137-2.354,1.17l-.45-3.779c-.049-.411-.418-.71-.833-.656-.411,.049-.705,.422-.656,.833l1.04,8.736c.164,1.383,1.338,2.425,2.73,2.425H13.224c1.393,0,2.566-1.042,2.73-2.425l1.04-8.736c.049-.412-.245-.785-.656-.833Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default machineWash;
