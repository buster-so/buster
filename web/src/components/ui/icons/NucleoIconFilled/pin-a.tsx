import type { iconProps } from './iconProps';

function pinA(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pin a';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C5.791,1,2.471,3.344,2.471,7.267c0,2.792,3.252,6.915,5.189,9.125,.339,.387,.827,.609,1.34,.609s1.001-.222,1.339-.608c1.938-2.21,5.19-6.335,5.19-9.125,0-3.922-3.32-6.267-6.529-6.267Zm2.633,9.952c-.087,.033-.177,.048-.266,.048-.303,0-.588-.185-.702-.484l-.384-1.016h-2.564l-.384,1.016c-.146,.387-.58,.583-.967,.436-.387-.147-.583-.58-.436-.967l2.081-5.5c.11-.292,.39-.484,.702-.484h.573c.312,0,.591,.193,.702,.484l2.081,5.5c.146,.388-.049,.82-.436,.967Z"
          fill="currentColor"
        />
        <path d="M8.286 8L9.714 8 9 6.112 8.286 8z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default pinA;
